const has = (v) => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v));

export const toPoint = (lat, lng) =>
  has(lat) && has(lng) ? { type: 'Point', coordinates: [Number(lng), Number(lat)] } : undefined;

export const haversineKm = (a, b) => {
  if (!a?.coordinates?.length || !b?.coordinates?.length) return null;
  const [lng1, lat1] = a.coordinates;
  const [lng2, lat2] = b.coordinates;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)) * 10) / 10;
};

export const withinRadius = (lat, lng, km) => ({
  $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], Number(km) / 6378.1] },
});
