import Application from '../models/Application.js';
import Animal from '../models/Animal.js';
import { notify } from '../utils/notify.js';
import { scheduleCheckIns } from '../utils/checkins.js';

const TRANSITIONS = {
  submitted: ['under_review', 'approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['completed', 'rejected'],
};
const ACTIVE = ['submitted', 'under_review', 'approved'];

const populate = (q) =>
  q.populate('animal', 'name species photos status').populate('applicant', 'name city').populate('owner', 'name organization verified');

export const createApplication = async (req, res) => {
  const { animalId, type, household, message } = req.body;
  const animal = await Animal.findById(animalId);
  if (!animal) return res.status(404).json({ message: 'Animal not found' });
  if (String(animal.owner) === req.user.id) return res.status(400).json({ message: 'You cannot apply for your own listing' });
  if (animal.status !== 'available') return res.status(400).json({ message: 'This animal is no longer available' });
  if (animal.listingType !== 'both' && animal.listingType !== type) return res.status(400).json({ message: `This animal is listed for ${animal.listingType} only` });
  if (await Application.exists({ animal: animal._id, applicant: req.user._id, status: { $in: ACTIVE } }))
    return res.status(409).json({ message: 'You already have an active application for this animal' });

  const app = await Application.create({
    animal: animal._id, applicant: req.user._id, owner: animal.owner, type, household, message,
    history: [{ status: 'submitted', by: req.user._id, note: 'Application submitted' }],
  });
  await notify(animal.owner, `New ${type} application for ${animal.name} from ${req.user.name}`, '/dashboard?tab=incoming');
  res.status(201).json({ application: app });
};

export const myApplications = async (req, res) => {
  const applications = await populate(Application.find({ applicant: req.user._id }).sort({ updatedAt: -1 }));
  res.json({ applications });
};

export const incomingApplications = async (req, res) => {
  const applications = await populate(Application.find({ owner: req.user._id }).sort({ updatedAt: -1 }));
  res.json({ applications });
};

export const getApplication = async (req, res) => {
  const app = await populate(Application.findById(req.params.id));
  if (!app) return res.status(404).json({ message: 'Application not found' });
  const uid = req.user.id;
  if (![String(app.applicant._id), String(app.owner._id)].includes(uid)) return res.status(403).json({ message: 'Not allowed' });
  res.json({ application: app });
};

export const updateStatus = async (req, res) => {
  const { status, note } = req.body;
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found' });
  if (String(app.owner) !== req.user.id) return res.status(403).json({ message: 'Only the listing owner can update this' });
  if (!TRANSITIONS[app.status]?.includes(status)) return res.status(400).json({ message: `Cannot move from ${app.status} to ${status}` });

  const animal = await Animal.findById(app.animal);
  if (status === 'approved') {
    if (animal.status !== 'available') return res.status(400).json({ message: 'Another application is already approved for this animal' });
    animal.status = 'pending';
  }
  if (status === 'rejected' && app.status === 'approved') animal.status = 'available';
  if (status === 'completed') {
    animal.status = app.type === 'adopt' ? 'adopted' : 'fostered';
    await scheduleCheckIns(app);
    const others = await Application.find({ animal: animal._id, _id: { $ne: app._id }, status: { $in: ['submitted', 'under_review'] } });
    for (const o of others) {
      o.status = 'rejected';
      o.history.push({ status: 'rejected', by: req.user._id, note: 'Animal was placed with another applicant' });
      await o.save();
      await notify(o.applicant, `${animal.name} has been placed with another applicant`, '/dashboard?tab=applications');
    }
  }
  await animal.save();

  app.status = status;
  app.history.push({ status, note, by: req.user._id });
  await app.save();

  const label = status.replace('_', ' ');
  await notify(app.applicant, `Your application for ${animal.name} is now ${label}`, '/dashboard?tab=applications');
  res.json({ application: app });
};

export const withdraw = async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found' });
  if (String(app.applicant) !== req.user.id) return res.status(403).json({ message: 'Not your application' });
  if (!ACTIVE.includes(app.status)) return res.status(400).json({ message: 'This application can no longer be withdrawn' });
  if (app.status === 'approved') await Animal.findByIdAndUpdate(app.animal, { status: 'available' });
  app.status = 'withdrawn';
  app.history.push({ status: 'withdrawn', by: req.user._id });
  await app.save();
  await notify(app.owner, `${req.user.name} withdrew their application`, '/dashboard?tab=incoming');
  res.json({ application: app });
};
