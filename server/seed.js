import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Animal from './models/Animal.js';

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany({}), Animal.deleteMany({})]);

const pt = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });

await User.create({ name: 'Admin', email: 'admin@pawpath.dev', password: 'password123', role: 'admin' });
const adopter = await User.create({
  name: 'Asha Rao', email: 'adopter@pawpath.dev', password: 'password123', role: 'adopter', city: 'Hyderabad',
  location: pt(17.4065, 78.4772),
  preferences: { species: ['dog'], sizes: ['small', 'medium'], homeType: 'apartment', hasKids: true, activity: 'medium', maxDistanceKm: 30 },
});
const shelter = await User.create({
  name: 'Maya Iyer', email: 'shelter@pawpath.dev', password: 'password123', role: 'shelter', organization: 'Second Chance Shelter',
  city: 'Hyderabad', location: pt(17.385, 78.4867), verified: true, bio: 'Rescuing and rehoming street animals since 2014.',
});
const caregiver = await User.create({
  name: 'Ravi Kumar', email: 'caregiver@pawpath.dev', password: 'password123', role: 'caregiver', city: 'Secunderabad',
  location: pt(17.4399, 78.4983), verified: true, bio: 'Independent foster caregiver.',
});

const base = (o, loc) => ({ owner: o._id, location: loc, city: o.city, photos: [] });
await Animal.insertMany([
  { ...base(shelter, pt(17.385, 78.4867)), name: 'Biscuit', species: 'dog', breed: 'Indian Pariah', gender: 'male', ageMonths: 18, size: 'medium', energy: 'medium', temperament: ['friendly', 'playful'], goodWith: { kids: true, dogs: true, cats: false }, health: { vaccinated: true, neutered: true, microchipped: false }, description: 'Biscuit loves walks and is great with children.', listingType: 'adopt' },
  { ...base(shelter, pt(17.39, 78.48)), name: 'Mochi', species: 'cat', breed: 'Domestic Shorthair', gender: 'female', ageMonths: 8, size: 'small', energy: 'high', temperament: ['curious', 'affectionate'], goodWith: { kids: true, dogs: false, cats: true }, health: { vaccinated: true, neutered: false }, description: 'A playful kitten looking for an active home.', listingType: 'both' },
  { ...base(caregiver, pt(17.4399, 78.4983)), name: 'Bruno', species: 'dog', breed: 'Labrador Mix', gender: 'male', ageMonths: 48, size: 'large', energy: 'high', temperament: ['loyal', 'energetic'], goodWith: { kids: true, dogs: true, cats: true }, health: { vaccinated: true, neutered: true, microchipped: true }, description: 'Needs a foster home for two months while his family relocates.', listingType: 'foster' },
  { ...base(caregiver, pt(17.44, 78.5)), name: 'Luna', species: 'dog', breed: 'Spitz', gender: 'female', ageMonths: 30, size: 'small', energy: 'low', temperament: ['calm', 'shy'], goodWith: { kids: false, dogs: true, cats: false }, health: { vaccinated: true, neutered: true }, description: 'A gentle lap dog who needs a quiet household.', listingType: 'adopt' },
]);

console.log('Seeded. Logins (password: password123): admin@, adopter@, shelter@, caregiver@pawpath.dev');
await mongoose.disconnect();
