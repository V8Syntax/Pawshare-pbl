import { useState } from 'react';
import { auth, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { SPECIES, SIZES, cap, getPosition } from '../utils.js';

export default function Profile() {
  const { user, refresh, isProvider } = useAuth();
  const p = user.preferences || {};
  const [f, setF] = useState({
    name: user.name, organization: user.organization || '', bio: user.bio || '', phone: user.phone || '', city: user.city || '',
    lat: user.location?.coordinates?.[1] ?? '', lng: user.location?.coordinates?.[0] ?? '',
    species: p.species || [], sizes: p.sizes || [], homeType: p.homeType || '', activity: p.activity || '',
    hasYard: !!p.hasYard, hasKids: !!p.hasKids, hasOtherPets: !!p.hasOtherPets, maxDistanceKm: p.maxDistanceKm || 50,
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggle = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const locate = async () => { try { const { lat, lng } = await getPosition(); setF((s) => ({ ...s, lat, lng })); } catch (e) { setMsg({ type: 'error', text: e.message }); } };

  const submit = async (e) => {
    e.preventDefault();
    const { species, sizes, homeType, activity, hasYard, hasKids, hasOtherPets, maxDistanceKm, ...rest } = f;
    try {
      await auth.update({ ...rest, preferences: { species, sizes, homeType, activity, hasYard, hasKids, hasOtherPets, maxDistanceKm: Number(maxDistanceKm) } });
      await refresh();
      setMsg({ type: 'ok', text: 'Profile saved.' });
    } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };

  return (
    <form onSubmit={submit} className="stack" style={{ maxWidth: 680 }}>
      <h1>Your profile</h1>
      {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="card stack">
        <div className="grid-2">
          <div><label>Name</label><input value={f.name} onChange={set('name')} required /></div>
          {isProvider && <div><label>Organization</label><input value={f.organization} onChange={set('organization')} /></div>}
          <div><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div>
          <div><label>City</label><input value={f.city} onChange={set('city')} /></div>
        </div>
        <div><label>About</label><textarea value={f.bio} onChange={set('bio')} /></div>
        <div className="row"><button type="button" className="btn secondary sm" onClick={locate}>Update my location</button><span className="muted small">{f.lat !== '' ? 'Location saved' : 'No location set'}</span></div>
      </div>

      {!isProvider && (
        <div className="card stack">
          <h2>Lifestyle preferences</h2>
          <p className="muted small" style={{ margin: 0 }}>Used to rank animals in "Matched for you".</p>
          <div><label>Species</label>{SPECIES.map((s) => <label key={s} className="check"><input type="checkbox" checked={f.species.includes(s)} onChange={() => toggle('species', s)} /> {cap(s)}</label>)}</div>
          <div><label>Size</label>{SIZES.map((s) => <label key={s} className="check"><input type="checkbox" checked={f.sizes.includes(s)} onChange={() => toggle('sizes', s)} /> {cap(s)}</label>)}</div>
          <div className="grid-2">
            <div><label>Home</label><select value={f.homeType} onChange={set('homeType')}><option value="">Not set</option><option value="apartment">Apartment</option><option value="house">House</option></select></div>
            <div><label>Your activity level</label><select value={f.activity} onChange={set('activity')}><option value="">Not set</option><option value="low">Relaxed</option><option value="medium">Moderate</option><option value="high">Very active</option></select></div>
            <div><label>Max distance (km)</label><input type="number" min="1" value={f.maxDistanceKm} onChange={set('maxDistanceKm')} /></div>
          </div>
          <div>
            <label className="check"><input type="checkbox" checked={f.hasYard} onChange={set('hasYard')} /> Yard</label>
            <label className="check"><input type="checkbox" checked={f.hasKids} onChange={set('hasKids')} /> Children at home</label>
            <label className="check"><input type="checkbox" checked={f.hasOtherPets} onChange={set('hasOtherPets')} /> Other pets</label>
          </div>
        </div>
      )}
      <div><button className="btn">Save profile</button></div>
    </form>
  );
}
