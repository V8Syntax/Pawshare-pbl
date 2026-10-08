import Animal from '../models/Animal.js';
import User from '../models/User.js';
import { toPoint, withinRadius, haversineKm } from '../utils/geo.js';
import { matchScore } from '../utils/match.js';

const csv = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => s.trim()).filter(Boolean);
const bool = (v) => (v === undefined ? undefined : v === true || v === 'true' || v === 'on');
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OWNER_FIELDS = 'name organization role verified ratingAvg ratingCount city';

function buildBody(b) {
  const data = {};
  ['name', 'species', 'breed', 'gender', 'size', 'energy', 'description', 'listingType', 'city', 'status'].forEach((k) => {
    if (b[k] !== undefined) data[k] = b[k];
  });
  if (b.ageMonths !== undefined) data.ageMonths = Number(b.ageMonths);
  if (b.temperament !== undefined) data.temperament = csv(b.temperament);
  data.goodWith = { kids: bool(b.goodKids), dogs: bool(b.goodDogs), cats: bool(b.goodCats) };
  data.health = { vaccinated: bool(b.vaccinated), neutered: bool(b.neutered), microchipped: bool(b.microchipped), notes: b.healthNotes };
  const point = toPoint(b.lat, b.lng);
  if (point) data.location = point;
  return data;
}

export const listAnimals = async (req, res) => {
  const { species, size, breed, ageMin, ageMax, listingType, temperament, q, lat, lng, radius, verified, owner, includeAll } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Number(req.query.limit) || 12);

  const filter = includeAll === 'true' && owner ? {} : { status: 'available' };
  if (owner) filter.owner = owner;
  if (species) filter.species = { $in: csv(species) };
  if (size) filter.size = { $in: csv(size) };
  if (breed) filter.breed = new RegExp(escapeRx(breed), 'i');
  if (listingType) filter.listingType = { $in: [listingType, 'both'] };
  if (temperament) filter.temperament = { $in: csv(temperament).map((t) => t.toLowerCase()) };
  if (q) filter.$or = [{ name: new RegExp(escapeRx(q), 'i') }, { breed: new RegExp(escapeRx(q), 'i') }, { description: new RegExp(escapeRx(q), 'i') }];
  if (ageMin || ageMax) {
    filter.ageMonths = {};
    if (ageMin) filter.ageMonths.$gte = Number(ageMin);
    if (ageMax) filter.ageMonths.$lte = Number(ageMax);
  }
  if (lat && lng) filter.location = withinRadius(lat, lng, radius || 25);
  if (verified === 'true') {
    const ids = await User.find({ verified: true }).distinct('_id');
    filter.owner = filter.owner ? filter.owner : { $in: ids };
  }

  const [items, total] = await Promise.all([
    Animal.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('owner', OWNER_FIELDS).lean(),
    Animal.countDocuments(filter),
  ]);

  const origin = lat && lng ? toPoint(lat, lng) : null;
  const animals = items.map((a) => ({ ...a, distanceKm: origin ? haversineKm(origin, a.location) : null }));
  if (origin) animals.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  res.json({ animals, total, page, pages: Math.ceil(total / limit) });
};

export const getAnimal = async (req, res) => {
  const animal = await Animal.findById(req.params.id).populate('owner', `${OWNER_FIELDS} bio`).lean();
  if (!animal) return res.status(404).json({ message: 'Animal not found' });
  res.json({ animal });
};

export const createAnimal = async (req, res) => {
  const data = buildBody(req.body);
  data.owner = req.user.id;
  data.photos = (req.files || []).map((f) => `/uploads/${f.filename}`);
  if (!data.location && req.user.location?.coordinates?.length) data.location = req.user.location;
  if (!data.city) data.city = req.user.city;
  const animal = await Animal.create(data);
  res.status(201).json({ animal });
};

async function ownedAnimal(req, res) {
  const animal = await Animal.findById(req.params.id);
  if (!animal) { res.status(404).json({ message: 'Animal not found' }); return null; }
  if (String(animal.owner) !== req.user.id && req.user.role !== 'admin') { res.status(403).json({ message: 'This is not your listing' }); return null; }
  return animal;
}

export const updateAnimal = async (req, res) => {
  const animal = await ownedAnimal(req, res);
  if (!animal) return;
  const data = buildBody(req.body);
  animal.set(data);
  const remove = req.body.removePhotos ? csv(req.body.removePhotos) : [];
  animal.photos = [...animal.photos.filter((p) => !remove.includes(p)), ...(req.files || []).map((f) => `/uploads/${f.filename}`)];
  await animal.save();
  res.json({ animal });
};

export const deleteAnimal = async (req, res) => {
  const animal = await ownedAnimal(req, res);
  if (!animal) return;
  await animal.deleteOne();
  res.json({ message: 'Listing removed' });
};

export const addHealthRecord = async (req, res) => {
  const animal = await ownedAnimal(req, res);
  if (!animal) return;
  const { date, type, description, vet } = req.body;
  animal.healthRecords.push({ date, type, description, vet });
  await animal.save();
  res.status(201).json({ healthRecords: animal.healthRecords });
};

export const getMatches = async (req, res) => {
  const filter = { status: 'available', owner: { $ne: req.user._id } };
  const animals = await Animal.find(filter).limit(200).populate('owner', OWNER_FIELDS).lean();
  const ranked = animals
    .map((a) => ({ ...a, match: matchScore(req.user, a) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 12);
  res.json({ animals: ranked });
};
