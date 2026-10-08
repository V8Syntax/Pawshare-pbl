import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { toPoint } from '../utils/geo.js';

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, organization: u.organization, bio: u.bio,
  phone: u.phone, city: u.city, location: u.location, verified: u.verified,
  ratingAvg: u.ratingAvg, ratingCount: u.ratingCount, preferences: u.preferences,
});

export const register = async (req, res) => {
  const { name, email, password, role, organization, city, lat, lng } = req.body;
  if (!['adopter', 'shelter', 'caregiver'].includes(role)) return res.status(400).json({ message: 'Choose a valid account type' });
  if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const user = await User.create({ name, email, password, role, organization, city, location: toPoint(lat, lng) });
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: signToken(user.id), user: publicUser(user) });
};

export const me = async (req, res) => res.json({ user: publicUser(req.user) });

export const updateProfile = async (req, res) => {
  const { name, bio, phone, city, organization, lat, lng, preferences } = req.body;
  const u = req.user;
  if (name !== undefined) u.name = name;
  if (bio !== undefined) u.bio = bio;
  if (phone !== undefined) u.phone = phone;
  if (city !== undefined) u.city = city;
  if (organization !== undefined) u.organization = organization;
  const point = toPoint(lat, lng);
  if (point) u.location = point;
  if (preferences) u.preferences = { ...u.preferences?.toObject?.(), ...preferences };
  await u.save();
  res.json({ user: publicUser(u) });
};
