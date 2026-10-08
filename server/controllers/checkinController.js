import CheckIn from '../models/CheckIn.js';
import Animal from '../models/Animal.js';
import { notify } from '../utils/notify.js';

const pop = (q) => q.populate('animal', 'name photos species').populate('adopter', 'name').sort({ dueDate: 1 });

export const myCheckIns = async (req, res) => res.json({ checkins: await pop(CheckIn.find({ adopter: req.user._id })) });

export const ownerCheckIns = async (req, res) =>
  res.json({ checkins: await pop(CheckIn.find({ owner: req.user._id, status: 'completed' })).sort({ completedAt: -1 }).limit(50) });

export const completeCheckIn = async (req, res) => {
  const c = await CheckIn.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Check-in not found' });
  if (String(c.adopter) !== req.user.id) return res.status(403).json({ message: 'Not your check-in' });
  if (c.status === 'completed') return res.status(400).json({ message: 'Already completed' });

  const { wellbeing, weightKg, healthUpdate, notes } = req.body;
  if (!wellbeing) return res.status(400).json({ message: 'Please rate how the animal is doing' });
  Object.assign(c, { wellbeing: Number(wellbeing), weightKg: weightKg ? Number(weightKg) : undefined, healthUpdate, notes, status: 'completed', completedAt: new Date() });
  await c.save();

  if (healthUpdate?.trim()) {
    await Animal.findByIdAndUpdate(c.animal, { $push: { healthRecords: { type: 'post-adoption', description: healthUpdate.trim() } } });
  }
  await notify(c.owner, `${req.user.name} submitted a check-in (${wellbeing}/5)`, '/dashboard?tab=checkins');
  res.json({ checkin: c });
};

/** Ad-hoc health update outside the schedule. */
export const logHealthUpdate = async (req, res) => {
  const c = await CheckIn.findOne({ application: req.params.applicationId, adopter: req.user._id });
  if (!c) return res.status(404).json({ message: 'No placement found for this application' });
  const { healthUpdate, weightKg } = req.body;
  if (!healthUpdate?.trim()) return res.status(400).json({ message: 'Describe the health update' });
  const log = await CheckIn.create({
    application: c.application, animal: c.animal, adopter: c.adopter, owner: c.owner, dueDate: new Date(),
    status: 'completed', completedAt: new Date(), wellbeing: 3, weightKg: weightKg ? Number(weightKg) : undefined, healthUpdate: healthUpdate.trim(),
  });
  await Animal.findByIdAndUpdate(c.animal, { $push: { healthRecords: { type: 'post-adoption', description: healthUpdate.trim() } } });
  res.status(201).json({ checkin: log });
};
