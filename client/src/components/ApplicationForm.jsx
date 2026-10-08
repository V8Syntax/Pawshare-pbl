import { useState } from 'react';
import { applications, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ApplicationForm({ animal, onDone }) {
  const { user } = useAuth();
  const p = user.preferences || {};
  const [form, setForm] = useState({
    type: animal.listingType === 'foster' ? 'foster' : 'adopt',
    homeType: p.homeType || 'apartment', hasYard: !!p.hasYard, hasKids: !!p.hasKids, hasOtherPets: !!p.hasOtherPets,
    experience: 'some', hoursAlone: 4, message: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { type, message, ...household } = form;
      await applications.create({ animalId: animal._id, type, message, household: { ...household, hoursAlone: Number(household.hoursAlone) } });
      onDone();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="stack">
      {error && <div className="alert error">{error}</div>}
      {animal.listingType === 'both' && (
        <div><label>I want to</label>
          <select value={form.type} onChange={set('type')}><option value="adopt">Adopt</option><option value="foster">Foster</option></select>
        </div>
      )}
      <div className="grid-2">
        <div><label>Home type</label>
          <select value={form.homeType} onChange={set('homeType')}><option value="apartment">Apartment</option><option value="house">House</option></select>
        </div>
        <div><label>Experience with animals</label>
          <select value={form.experience} onChange={set('experience')}><option value="none">First time</option><option value="some">Some</option><option value="experienced">Experienced</option></select>
        </div>
      </div>
      <div>
        <label className="check"><input type="checkbox" checked={form.hasYard} onChange={set('hasYard')} /> Yard or garden</label>
        <label className="check"><input type="checkbox" checked={form.hasKids} onChange={set('hasKids')} /> Children at home</label>
        <label className="check"><input type="checkbox" checked={form.hasOtherPets} onChange={set('hasOtherPets')} /> Other pets</label>
      </div>
      <div><label>Hours the animal would be alone each day</label><input type="number" min="0" max="24" value={form.hoursAlone} onChange={set('hoursAlone')} /></div>
      <div><label>Why are you a good fit?</label><textarea required value={form.message} onChange={set('message')} /></div>
      <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Submit application'}</button>
    </form>
  );
}
