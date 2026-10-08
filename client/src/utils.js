export const ageLabel = (m) => (m < 12 ? `${m} mo` : `${Math.floor(m / 12)} yr${m >= 24 ? 's' : ''}${m % 12 ? ` ${m % 12} mo` : ''}`);
export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const providerName = (o) => o?.organization || o?.name || 'Unknown';
export const latLng = (loc) => (loc?.coordinates?.length ? [loc.coordinates[1], loc.coordinates[0]] : null);

export const SPECIES = ['dog', 'cat', 'rabbit', 'bird', 'other'];
export const SIZES = ['small', 'medium', 'large'];
export const TEMPERAMENTS = ['friendly', 'playful', 'calm', 'shy', 'energetic', 'affectionate', 'independent', 'loyal'];

export const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not supported by this browser'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Location permission was denied')),
      { timeout: 8000 }
    );
  });
