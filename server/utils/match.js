import { haversineKm } from './geo.js';

const LEVELS = ['low', 'medium', 'high'];

/** Scores 0-100 how well an animal fits an adopter's lifestyle preferences. */
export function matchScore(user, animal) {
  const p = user.preferences || {};
  let score = 0;
  const reasons = [];

  if (!p.species?.length || p.species.includes(animal.species)) { score += 25; if (p.species?.length) reasons.push('Preferred species'); }
  if (!p.sizes?.length || p.sizes.includes(animal.size)) { score += 15; if (p.sizes?.length) reasons.push('Preferred size'); }

  if (p.activity) {
    const diff = Math.abs(LEVELS.indexOf(p.activity) - LEVELS.indexOf(animal.energy));
    if (diff === 0) { score += 20; reasons.push('Energy level matches your lifestyle'); }
    else if (diff === 1) score += 10;
  } else score += 10;

  if (p.hasKids) { if (animal.goodWith?.kids) { score += 15; reasons.push('Good with children'); } }
  else score += 15;

  if (p.hasOtherPets) { if (animal.goodWith?.dogs || animal.goodWith?.cats) { score += 10; reasons.push('Gets along with other pets'); } }
  else score += 10;

  const km = haversineKm(user.location, animal.location);
  if (km === null) score += 7;
  else if (km <= (p.maxDistanceKm || 50)) { score += 15; reasons.push(`${km} km away`); }
  else if (km <= (p.maxDistanceKm || 50) * 2) score += 7;

  return { score: Math.min(100, score), reasons, distanceKm: km };
}
