import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { latLng, providerName, cap, ageLabel } from '../utils.js';

const icon = (kind) => L.divIcon({ className: '', html: `<div class="pin ${kind}"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function MapView({ animals = [], shelters = [], center }) {
  const fallback = center || [20.59, 78.96];
  return (
    <MapContainer center={fallback} zoom={center ? 11 : 5} className="map" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter center={center} />
      {shelters.map((s) => latLng(s.location) && (
        <Marker key={s._id} position={latLng(s.location)} icon={icon('shelter')}>
          <Popup>
            <strong>{providerName(s)}</strong>{s.verified && ' ✓'}<br />
            {s.availableCount} animal(s) available{s.distanceKm != null && ` · ${s.distanceKm} km`}<br />
            <Link to={`/providers/${s._id}`}>View profile</Link>
          </Popup>
        </Marker>
      ))}
      {animals.map((a) => latLng(a.location) && (
        <Marker key={a._id} position={latLng(a.location)} icon={icon('animal')}>
          <Popup>
            <strong>{a.name}</strong><br />
            {cap(a.species)} · {ageLabel(a.ageMonths)}<br />
            <Link to={`/animals/${a._id}`}>View details</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
