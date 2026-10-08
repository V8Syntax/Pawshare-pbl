import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { animals as animalsApi, applications, checkins, messages, providers, admin, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { cap, fmtDate, providerName } from '../utils.js';

const useLoad = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => fn().then(setData).catch((e) => setError(errMsg(e))), deps); // eslint-disable-line
  useEffect(() => { reload(); }, [reload]);
  return [data, reload, error];
};

const ACTIVE = ['submitted', 'under_review', 'approved'];

function Timeline({ history }) {
  return (
    <ul className="timeline">
      {history.map((h, i) => <li key={i}>{cap(h.status.replace('_', ' '))} · {fmtDate(h.at)}{h.note ? ` — ${h.note}` : ''}</li>)}
    </ul>
  );
}

function ReviewForm({ app, onDone }) {
  const [r, setR] = useState({ rating: 5, comment: '' });
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await providers.review(app.owner._id, { applicationId: app._id, ...r, rating: Number(r.rating) }); setMsg('Thanks for your review.'); onDone(); }
    catch (err) { setMsg(errMsg(err)); }
  };
  return (
    <form onSubmit={submit} className="row" style={{ marginTop: '.5rem', alignItems: 'flex-end' }}>
      <div><label>Rate {providerName(app.owner)}</label>
        <select value={r.rating} onChange={(e) => setR({ ...r, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && 's'}</option>)}</select>
      </div>
      <div style={{ flex: 1, minWidth: 160 }}><label>Comment (optional)</label><input value={r.comment} onChange={(e) => setR({ ...r, comment: e.target.value })} /></div>
      <button className="btn sm">Submit review</button>
      {msg && <span className="small muted">{msg}</span>}
    </form>
  );
}

function HealthLog({ app }) {
  const [f, setF] = useState({ healthUpdate: '', weightKg: '' });
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await checkins.log(app._id, f); setF({ healthUpdate: '', weightKg: '' }); setMsg('Health update logged.'); }
    catch (err) { setMsg(errMsg(err)); }
  };
  return (
    <form onSubmit={submit} className="row" style={{ marginTop: '.5rem', alignItems: 'flex-end' }}>
      <div style={{ flex: 1, minWidth: 180 }}><label>Log a health update</label><input required placeholder="Vet visit, new medication, weight change…" value={f.healthUpdate} onChange={(e) => setF({ ...f, healthUpdate: e.target.value })} /></div>
      <div style={{ width: 110 }}><label>Weight (kg)</label><input type="number" step="0.1" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} /></div>
      <button className="btn sm secondary">Log update</button>
      {msg && <span className="small muted">{msg}</span>}
    </form>
  );
}

function MyApplications() {
  const [data, reload, error] = useLoad(applications.mine);
  const withdraw = async (id) => { if (confirm('Withdraw this application?')) { await applications.withdraw(id); reload(); } };
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <p className="empty">Loading…</p>;
  if (!data.applications.length) return <p className="empty">You have not applied yet. <Link to="/">Browse animals</Link></p>;
  return (
    <div className="stack">
      {data.applications.map((a) => (
        <div className="card" key={a._id}>
          <div className="row between">
            <h3 style={{ margin: 0 }}><Link to={`/animals/${a.animal._id}`}>{a.animal.name}</Link> <span className="muted small">· {a.type === 'adopt' ? 'Adoption' : 'Foster'} via {providerName(a.owner)}</span></h3>
            <StatusBadge status={a.status} />
          </div>
          <Timeline history={a.history} />
          <div className="row" style={{ marginTop: '.5rem' }}>
            {ACTIVE.includes(a.status) && <button className="btn danger sm" onClick={() => withdraw(a._id)}>Withdraw</button>}
          </div>
          {a.status === 'completed' && <><HealthLog app={a} /><ReviewForm app={a} onDone={reload} /></>}
        </div>
      ))}
    </div>
  );
}

function IncomingApplications() {
  const nav = useNavigate();
  const [data, reload, error] = useLoad(applications.incoming);
  const [err, setErr] = useState('');
  const act = async (id, status) => {
    const note = status === 'rejected' ? prompt('Add a short note for the applicant (optional)') ?? '' : '';
    try { await applications.setStatus(id, status, note); reload(); } catch (e) { setErr(errMsg(e)); }
  };
  const message = async (a) => {
    const { conversationId } = await messages.start({ to: a.applicant._id, animalId: a.animal._id, text: `Hi ${a.applicant.name}, about your application for ${a.animal.name}…` });
    nav(`/messages?c=${conversationId}`);
  };
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <p className="empty">Loading…</p>;
  if (!data.applications.length) return <p className="empty">No applications yet.</p>;
  return (
    <div className="stack">
      {err && <div className="alert error">{err}</div>}
      {data.applications.map((a) => (
        <div className="card" key={a._id}>
          <div className="row between">
            <h3 style={{ margin: 0 }}>{a.applicant.name} <span className="muted small">for <Link to={`/animals/${a.animal._id}`}>{a.animal.name}</Link> · {a.type}</span></h3>
            <StatusBadge status={a.status} />
          </div>
          <p className="small muted" style={{ margin: '.4rem 0' }}>
            {cap(a.household.homeType)}{a.household.hasYard && ' with yard'} · kids: {a.household.hasKids ? 'yes' : 'no'} · other pets: {a.household.hasOtherPets ? 'yes' : 'no'} · experience: {a.household.experience} · alone {a.household.hoursAlone}h/day
          </p>
          <p style={{ whiteSpace: 'pre-wrap', margin: '.4rem 0' }}>{a.message}</p>
          <Timeline history={a.history} />
          <div className="row" style={{ marginTop: '.6rem' }}>
            {a.status === 'submitted' && <button className="btn sm secondary" onClick={() => act(a._id, 'under_review')}>Start review</button>}
            {['submitted', 'under_review'].includes(a.status) && <button className="btn sm" onClick={() => act(a._id, 'approved')}>Approve</button>}
            {a.status === 'approved' && <button className="btn sm" onClick={() => act(a._id, 'completed')}>Mark as placed</button>}
            {ACTIVE.includes(a.status) && <button className="btn sm danger" onClick={() => act(a._id, 'rejected')}>Reject</button>}
            <button className="btn sm secondary" onClick={() => message(a)}>Message</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Listings() {
  const { user } = useAuth();
  const [data] = useLoad(() => animalsApi.list({ owner: user.id, includeAll: 'true', limit: 48 }), [user.id]);
  if (!data) return <p className="empty">Loading…</p>;
  if (!data.animals.length) return <p className="empty">No listings yet. <Link to="/animals/new">Add your first animal</Link></p>;
  return (
    <table className="simple card">
      <thead><tr><th>Name</th><th>Species</th><th>For</th><th>Status</th><th /></tr></thead>
      <tbody>{data.animals.map((a) => (
        <tr key={a._id}>
          <td><Link to={`/animals/${a._id}`}>{a.name}</Link></td><td>{cap(a.species)}</td><td>{a.listingType}</td>
          <td><StatusBadge status={a.status} /></td><td><Link to={`/animals/${a._id}/edit`}>Edit</Link></td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function CheckInForm({ c, onDone }) {
  const [f, setF] = useState({ wellbeing: 5, weightKg: '', healthUpdate: '', notes: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await checkins.complete(c._id, f); onDone(); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={submit} className="stack" style={{ marginTop: '.6rem' }}>
      {error && <div className="alert error">{error}</div>}
      <div className="grid-2">
        <div><label>How is {c.animal.name} doing?</label>
          <select value={f.wellbeing} onChange={(e) => setF({ ...f, wellbeing: e.target.value })}>
            {[[5, 'Thriving'], [4, 'Doing well'], [3, 'Settling in'], [2, 'Struggling'], [1, 'Needs help']].map(([n, l]) => <option key={n} value={n}>{n} – {l}</option>)}
          </select>
        </div>
        <div><label>Weight (kg, optional)</label><input type="number" step="0.1" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} /></div>
      </div>
      <div><label>Health update (optional)</label><input value={f.healthUpdate} onChange={(e) => setF({ ...f, healthUpdate: e.target.value })} /></div>
      <div><label>Notes for the {`shelter`}</label><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      <div><button className="btn sm">Submit check-in</button></div>
    </form>
  );
}

function CheckIns({ isOwnerView }) {
  const [data, reload, error] = useLoad(isOwnerView ? checkins.owner : checkins.mine, [isOwnerView]);
  const [open, setOpen] = useState(null);
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <p className="empty">Loading…</p>;
  const list = data.checkins;
  if (!list.length) return <p className="empty">{isOwnerView ? 'No check-ins submitted yet.' : 'Check-ins are scheduled once an adoption or foster placement is completed.'}</p>;
  const pending = list.filter((c) => c.status === 'pending');
  const done = list.filter((c) => c.status === 'completed');
  return (
    <div className="stack">
      {pending.map((c) => {
        const overdue = new Date(c.dueDate) < new Date();
        return (
          <div className="card" key={c._id}>
            <div className="row between">
              <strong>{c.animal.name}</strong>
              <span className={`badge ${overdue ? 'bad' : 'warn'}`}>{overdue ? 'Overdue' : 'Due'} {fmtDate(c.dueDate)}</span>
            </div>
            {open === c._id ? <CheckInForm c={c} onDone={() => { setOpen(null); reload(); }} /> : <button className="btn sm" style={{ marginTop: '.5rem' }} onClick={() => setOpen(c._id)}>Complete check-in</button>}
          </div>
        );
      })}
      {done.length > 0 && (
        <table className="simple card">
          <thead><tr><th>Date</th><th>Animal</th>{isOwnerView && <th>Adopter</th>}<th>Wellbeing</th><th>Update</th></tr></thead>
          <tbody>{done.map((c) => (
            <tr key={c._id}><td>{fmtDate(c.completedAt)}</td><td>{c.animal.name}</td>{isOwnerView && <td>{c.adopter.name}</td>}<td>{c.wellbeing}/5</td><td>{c.healthUpdate || c.notes || '—'}{c.weightKg ? ` (${c.weightKg} kg)` : ''}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

function AdminPanel() {
  const [data, reload] = useLoad(admin.providers);
  if (!data) return <p className="empty">Loading…</p>;
  return (
    <table className="simple card">
      <thead><tr><th>Name</th><th>Type</th><th>City</th><th>Status</th><th /></tr></thead>
      <tbody>{data.providers.map((p) => (
        <tr key={p._id}>
          <td><Link to={`/providers/${p._id}`}>{providerName(p)}</Link></td><td>{p.role}</td><td>{p.city || '—'}</td>
          <td>{p.verified ? <span className="badge">Verified</span> : <span className="badge warn">Pending</span>}</td>
          <td><button className="btn sm secondary" onClick={async () => { await admin.verify(p._id, !p.verified); reload(); }}>{p.verified ? 'Revoke' : 'Verify'}</button></td>
        </tr>
      ))}</tbody>
    </table>
  );
}

export default function Dashboard() {
  const { user, isProvider } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = isProvider
    ? [['incoming', 'Applications received'], ['listings', 'My listings'], ['checkins', 'Check-in updates'], ...(user.role === 'admin' ? [['admin', 'Verification']] : [])]
    : [['applications', 'My applications'], ['checkins', 'Check-ins']];
  const tab = tabs.some(([k]) => k === params.get('tab')) ? params.get('tab') : tabs[0][0];

  return (
    <div>
      <div className="row between">
        <h1>Dashboard</h1>
        {isProvider && !user.verified && user.role !== 'admin' && <span className="badge warn">Awaiting verification</span>}
      </div>
      <div className="tabs">{tabs.map(([k, label]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setParams({ tab: k })}>{label}</button>)}</div>
      {tab === 'applications' && <MyApplications />}
      {tab === 'incoming' && <IncomingApplications />}
      {tab === 'listings' && <Listings />}
      {tab === 'checkins' && <CheckIns isOwnerView={isProvider} />}
      {tab === 'admin' && <AdminPanel />}
    </div>
  );
}
