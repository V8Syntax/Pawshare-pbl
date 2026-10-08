import User from '../models/User.js';
import Animal from '../models/Animal.js';
import Application from '../models/Application.js';
import Review from '../models/Review.js';
import { toPoint, withinRadius, haversineKm } from '../utils/geo.js';

const PUBLIC = 'name organization role bio city location verified ratingAvg ratingCount createdAt';

export const listProviders = async (req, res) => {
  const { lat, lng, radius, all } = req.query;
  const filter = { role: { $in: ['shelter', 'caregiver'] } };
  if (all !== 'true') filter.verified = true;
  if (lat && lng) filter.location = withinRadius(lat, lng, radius || 50);
  const providers = await User.find(filter).select(PUBLIC).lean();
  const counts = await Animal.aggregate([
    { $match: { status: 'available', owner: { $in: providers.map((p) => p._id) } } },
    { $group: { _id: '$owner', n: { $sum: 1 } } },
  ]);
  const byOwner = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  const origin = toPoint(lat, lng);
  res.json({
    providers: providers.map((p) => ({ ...p, availableCount: byOwner[String(p._id)] || 0, distanceKm: origin ? haversineKm(origin, p.location) : null })),
  });
};

export const getProvider = async (req, res) => {
  const provider = await User.findOne({ _id: req.params.id, role: { $in: ['shelter', 'caregiver'] } }).select(PUBLIC).lean();
  if (!provider) return res.status(404).json({ message: 'Profile not found' });
  const [animals, completed, reviews] = await Promise.all([
    Animal.find({ owner: provider._id, status: 'available' }).sort({ createdAt: -1 }).lean(),
    Application.find({ owner: provider._id, status: 'completed' }).sort({ updatedAt: -1 }).populate('animal', 'name species photos').lean(),
    Review.find({ provider: provider._id }).sort({ createdAt: -1 }).limit(20).populate('reviewer', 'name').lean(),
  ]);
  res.json({
    provider, animals, reviews,
    stats: { adoptions: completed.filter((a) => a.type === 'adopt').length, fosters: completed.filter((a) => a.type === 'foster').length },
    history: completed.slice(0, 10).map((a) => ({ id: a._id, type: a.type, animal: a.animal, date: a.updatedAt })),
  });
};

export const createReview = async (req, res) => {
  const { applicationId, rating, comment } = req.body;
  const app = await Application.findById(applicationId);
  if (!app || String(app.applicant) !== req.user.id || String(app.owner) !== req.params.id || app.status !== 'completed')
    return res.status(400).json({ message: 'You can only review a provider after a completed adoption or foster' });
  await Review.create({ provider: req.params.id, reviewer: req.user._id, application: app._id, rating: Number(rating), comment });
  const [agg] = await Review.aggregate([{ $match: { provider: app.owner } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await User.findByIdAndUpdate(app.owner, { ratingAvg: Math.round(agg.avg * 10) / 10, ratingCount: agg.n });
  res.status(201).json({ message: 'Thanks for your review' });
};

export const verifyProvider = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { verified: req.body.verified !== false }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user.id, verified: user.verified });
};
