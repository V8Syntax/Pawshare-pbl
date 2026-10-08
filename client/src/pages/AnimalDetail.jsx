import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { animals as animalsApi, messages, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ApplicationForm from '../components/ApplicationForm.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Stars from '../components/Stars.jsx';
import { ageLabel, cap, fmtDate, providerName } from '../utils.js';

function HealthRecordForm({ animalId, onAdded }) {
  const [f, setF] = useState({ type: 'checkup', description: '', vet: '' });
  const submit = async (e) => {
    e.preventDefault();
    await animalsApi.addHealth(animalId, f);
    setF({ type: 'checkup', description: '', vet: '' });
    onAdded();
  };
  return (
    <form onSubmit={submit} className="row" style={{ marginTop: '.75rem', alignItems: 'flex-end' }}>
      <div><label>Type</label>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {['vaccination', 'treatment', 'checkup', 'surgery', 'other'].map((t) => <option key={t} value={t}>{cap(t)}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}><label>Details</label><input required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div><label>Vet (optional)</label><input value={f.vet} onChange={(e) => setF({ ...f, vet: e.target.value })} /></div>
      <button className="btn sm">Add record</button>
    </form>
  );
}

export default function AnimalDetail() {
  const { id } = useParams();
  const { user, isProvider } = useAuth();
  const nav = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(null); // 'apply' | 'message'
  const [sent, setSent] = useState('');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(0);

  const load = () => animalsApi.get(id).then((d) => setAnimal(d.animal)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [id]);

  if (error) return <div className="alert error">{error}</div>;
  if (!animal) return <p className="empty">Loading…</p>;

  const isOwner = user && String(animal.owner._id) === user.id;
  const available = animal.status === 'available';
  const needLogin = () => nav('/login', { state: { from: `/animals/${id}` } });

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      const { conversationId } = await messages.start({ to: animal.owner._id, animalId: animal._id, text });
      nav(`/messages?c=${conversationId}`);
    } catch (err) { setError(errMsg(err)); }
  };

  const remove = async () => {
    if (!confirm(`Remove ${animal.name}'s listing?`)) return;
    await animalsApi.remove(animal._id);
    nav('/dashboard?tab=listings');
  };

  const Y = (v) => (v === undefined || v === null ? '—' : v ? 'Yes' : 'No');

  return (
    <div className="detail">
      <div className="stack">
        <div className="gallery">
          {animal.photos.length === 0 && <p className="empty card" style={{ gridColumn: '1/-1' }}>No photos yet</p>}
          {animal.photos.length > 0 && <img className="main" src={animal.photos[photo]} alt={animal.name} />}
          {animal.photos.length > 1 && animal.photos.map((p, i) => <img key={p} src={p} alt="" onClick={() => setPhoto(i)} style={{ cursor: 'pointer', opacity: i === photo ? 1 : 0.7 }} />)}
        </div>

        <div className="card">
          <h2>About {animal.name}</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{animal.description || 'No description yet.'}</p>
          <div>{animal.temperament.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
        </div>

        <div className="card">
          <h2>Health</h2>
          <table className="simple">
            <tbody>
              <tr><th>Vaccinated</th><td>{Y(animal.health?.vaccinated)}</td><th>Neutered / spayed</th><td>{Y(animal.health?.neutered)}</td></tr>
              <tr><th>Microchipped</th><td>{Y(animal.health?.microchipped)}</td><th>Good with kids / dogs / cats</th><td>{Y(animal.goodWith?.kids)} / {Y(animal.goodWith?.dogs)} / {Y(animal.goodWith?.cats)}</td></tr>
            </tbody>
          </table>
          {animal.health?.notes && <p className="small">{animal.health.notes}</p>}
          <h3 style={{ marginTop: '1rem' }}>Records</h3>
          {animal.healthRecords.length === 0 ? <p className="muted small">No records logged.</p> : (
            <table className="simple">
              <thead><tr><th>Date</th><th>Type</th><th>Details</th></tr></thead>
              <tbody>{[...animal.healthRecords].reverse().map((r) => (
                <tr key={r._id}><td>{fmtDate(r.date)}</td><td>{cap(r.type)}</td><td>{r.description}{r.vet && <span className="muted"> — {r.vet}</span>}</td></tr>
              ))}</tbody>
            </table>
          )}
          {isOwner && <HealthRecordForm animalId={animal._id} onAdded={load} />}
        </div>
      </div>

      <aside className="stack">
        <div className="card">
          <div className="row between"><h1 style={{ margin: 0 }}>{animal.name}</h1><StatusBadge status={animal.status} /></div>
          <p className="muted">{cap(animal.species)}{animal.breed ? ` · ${animal.breed}` : ''} · {cap(animal.gender)} · {ageLabel(animal.ageMonths)} · {cap(animal.size)}</p>
          <p className="small">Energy: {cap(animal.energy)} · Available for: {animal.listingType === 'both' ? 'adoption or foster' : animal.listingType}{animal.city && ` · ${animal.city}`}</p>

          {isOwner ? (
            <div className="row">
              <Link className="btn secondary" to={`/animals/${animal._id}/edit`}>Edit listing</Link>
              <button className="btn danger" onClick={remove}>Remove</button>
            </div>
          ) : !available ? (
            <div className="alert ok">This animal is no longer accepting applications.</div>
          ) : isProvider ? (
            <p className="muted small">Log in with an adopter account to apply.</p>
          ) : (
            <div className="row">
              <button className="btn" onClick={() => (user ? setPanel(panel === 'apply' ? null : 'apply') : needLogin())}>
                {animal.listingType === 'foster' ? 'Apply to foster' : animal.listingType === 'both' ? 'Apply' : 'Apply to adopt'}
              </button>
              <button className="btn secondary" onClick={() => (user ? setPanel(panel === 'message' ? null : 'message') : needLogin())}>Message</button>
            </div>
          )}
          {sent && <div className="alert ok" style={{ marginTop: '.75rem' }}>{sent} <Link to="/dashboard?tab=applications">Track it on your dashboard</Link>.</div>}
        </div>

        {panel === 'apply' && user && (
          <div className="card"><h2>Your application</h2>
            <ApplicationForm animal={animal} onDone={() => { setPanel(null); setSent('Application submitted.'); }} />
          </div>
        )}
        {panel === 'message' && user && (
          <form className="card stack" onSubmit={sendMessage}>
            <h2>Message {providerName(animal.owner)}</h2>
            <textarea required placeholder={`Hi, I'd like to know more about ${animal.name}…`} value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn">Send message</button>
          </form>
        )}

        <div className="card">
          <h3>{providerName(animal.owner)}</h3>
          <p className="small" style={{ margin: 0 }}>
            {animal.owner.verified ? <span className="verified">✓ Verified {animal.owner.role}</span> : <span className="muted">Not yet verified</span>}
          </p>
          <Stars value={animal.owner.ratingAvg} count={animal.owner.ratingCount} />
          <p style={{ marginBottom: 0 }}><Link to={`/providers/${animal.owner._id}`}>View profile and adoption history</Link></p>
        </div>
      </aside>
    </div>
  );
}
