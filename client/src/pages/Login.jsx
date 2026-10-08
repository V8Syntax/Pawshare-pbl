import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try { await login(form.email, form.password); nav(location.state?.from || '/', { replace: true }); }
    catch (err) { setError(errMsg(err)); }
  };

  return (
    <form onSubmit={submit} className="card auth-box stack">
      <h1>Log in</h1>
      {error && <div className="alert error">{error}</div>}
      <div><label htmlFor="email">Email</label><input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><label htmlFor="pw">Password</label><input id="pw" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <button className="btn">Log in</button>
      <p className="muted small">New here? <Link to="/register">Create an account</Link></p>
    </form>
  );
}
