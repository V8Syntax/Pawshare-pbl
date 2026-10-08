import { useEffect, useState } from 'react';
import { animals as animalsApi, providers as providersApi, errMsg } from '../api.js';
import MapView from '../components/MapView.jsx';
import { getPosition } from '../utils.js';

export default function MapPage() {
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(25);
  const [layers, setLayers] = useState({ animals: true, shelters: true });
  const [data, setData] = useState({ animals: [], providers: [] });
  const [error, setError] = useState('');

  useEffect(() => { getPosition().then(({ lat, lng }) => setCenter([lat, lng])).catch((e) => setError(`${e.message}. Showing all listings.`)); }, []);

  useEffect(() => {
    const geo = center ? { lat: center[0], lng: center[1], radius } : {};
    Promise.all([animalsApi.list({ ...geo, limit: 48 }), providersApi.list(geo)])
      .then(([a, p]) => setData({ animals: a.animals, providers: p.providers }))
      .catch((e) => setError(errMsg(e)));
  }, [center, radius]);

  return (
    <div className="stack">
      <div className="row between">
        <h1>Nearby on the map</h1>
        <div className="row">
          <label className="check"><input type="checkbox" checked={layers.animals} onChange={(e) => setLayers({ ...layers, animals: e.target.checked })} /> <span className="pin animal" style={{ display: 'inline-block' }} /> Animals ({data.animals.length})</label>
          <label className="check"><input type="checkbox" checked={layers.shelters} onChange={(e) => setLayers({ ...layers, shelters: e.target.checked })} /> <span className="pin shelter" style={{ display: 'inline-block' }} /> Shelters ({data.providers.length})</label>
          <select aria-label="Radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: 'auto' }} disabled={!center}>
            {[10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <MapView center={center} animals={layers.animals ? data.animals : []} shelters={layers.shelters ? data.providers : []} />
    </div>
  );
}
