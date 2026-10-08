import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { providers, errMsg } from '../api.js';
import AnimalCard from '../components/AnimalCard.jsx';
import Stars from '../components/Stars.jsx';
import { cap, fmtDate, providerName } from '../utils.js';

export default function ProviderProfile() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { providers.get(id).then(setD).catch((e) => setError(errMsg(e))); }, [id]);

  if (error) return <div className="alert error">{error}</div>;
  if (!d) return <p className="empty">Loading…</p>;
  const { provider: p, animals, reviews, stats, history } = d;

  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <h1 style={{ margin: 0 }}>{providerName(p)}</h1>
          {p.verified ? <span className="verified">✓ Verified {p.role}</span> : <span className="badge warn">Not yet verified</span>}
        </div>
        <p className="muted" style={{ margin: '.25rem 0' }}>{cap(p.role)}{p.city && ` · ${p.city}`} · Member since {fmtDate(p.createdAt)}</p>
        <Stars value={p.ratingAvg} count={p.ratingCount} />
        {p.bio && <p>{p.bio}</p>}
        <div className="row small"><strong>{stats.adoptions}</strong> adoptions <strong>{stats.fosters}</strong> fosters placed <strong>{animals.length}</strong> animals available</div>
      </div>

      <section>
        <h2>Available animals</h2>
        {animals.length === 0 ? <p className="empty">No animals listed right now.</p> : <div className="grid">{animals.map((a) => <AnimalCard key={a._id} animal={{ ...a, owner: p }} />)}</div>}
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Adoption history</h2>
          {history.length === 0 ? <p className="muted small">No completed placements yet.</p> : (
            <table className="simple"><tbody>{history.map((h) => (
              <tr key={h.id}><td>{h.animal?.name}</td><td>{cap(h.type)}</td><td>{fmtDate(h.date)}</td></tr>
            ))}</tbody></table>
          )}
        </section>
        <section className="card">
          <h2>Reviews</h2>
          {reviews.length === 0 ? <p className="muted small">No reviews yet.</p> : reviews.map((r) => (
            <div key={r._id} style={{ marginBottom: '.75rem' }}>
              <Stars value={r.rating} /> <span className="small muted">{r.reviewer?.name} · {fmtDate(r.createdAt)}</span>
              {r.comment && <p style={{ margin: '.2rem 0 0' }}>{r.comment}</p>}
            </div>
          ))}
        </section>
      </div>
      <p><Link to="/map">See shelters on the map</Link></p>
    </div>
  );
}
