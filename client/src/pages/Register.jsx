import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import { getPosition } from '../utils.js';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'adopter', organization: '', city: '', lat: '', lng: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isProvider = form.role !== 'adopter';

  const locate = async () => {
    try { const { lat, lng } = await getPosition(); setForm((f) => ({ ...f, lat, lng })); setError(''); } catch (e) { setError(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    try { await register(form); nav('/dashboard'); } catch (err) { setError(errMsg(err)); }
  };

  return (
    <form onSubmit={submit} className="card auth-box stack">
      <h1>Create your account</h1>
      {error && <div className="alert error">{error}</div>}
      <div><label>I am a…</label>
        <select value={form.role} onChange={set('role')}>
          <option value="adopter">Adopter or foster</option><option value="shelter">Shelter</option><option value="caregiver">Individual caregiver</option>
        </select>
      </div>
      <div><label>Full name</label><input required value={form.name} onChange={set('name')} /></div>
      {isProvider && <div><label>{form.role === 'shelter' ? 'Shelter name' : 'Display name (optional)'}</label><input value={form.organization} onChange={set('organization')} /></div>}
      <div><label>Email</label><input type="email" required value={form.email} onChange={set('email')} /></div>
      <div><label>Password</label><input type="password" minLength={6} required value={form.password} onChange={set('password')} /></div>
      <div><label>City</label><input value={form.city} onChange={set('city')} /></div>
      <div className="row">
        <button type="button" className="btn secondary sm" onClick={locate}>Use my location</button>
        <span className="muted small">{form.lat ? 'Location saved for distance matching' : 'Used for nearby results and matching'}</span>
      </div>
      {isProvider && <p className="muted small">Shelter and caregiver profiles are reviewed by an admin before they show a verified badge.</p>}
      <button className="btn">Sign up</button>
      <p className="muted small">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
