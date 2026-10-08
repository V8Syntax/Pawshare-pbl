import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animals as animalsApi, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AnimalCard from '../components/AnimalCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import { getPosition } from '../utils.js';

const EMPTY = { q: '', species: '', breed: '', size: '', age: '', listingType: '', radius: 25, verified: false, lat: '', lng: '' };

export default function Browse() {
  const { user } = useAuth();
  const [view, setView] = useState('all');
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ animals: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    const t = setTimeout(async () => {
      try {
        if (view === 'matches') setData({ ...(await animalsApi.matches()), pages: 1 });
        else {
          const [ageMin, ageMax] = filters.age ? filters.age.split('-') : [];
          const { age, ...rest } = filters;
          const params = Object.fromEntries(Object.entries({ ...rest, ageMin, ageMax, page }).filter(([, v]) => v !== '' && v !== false && v != null));
          if (!params.lat) delete params.radius;
          setData(await animalsApi.list(params));
        }
      } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [filters, page, view]);

  const locate = async () => {
    setLocating(true); setError('');
    try { const { lat, lng } = await getPosition(); setFilters((f) => ({ ...f, lat, lng })); setPage(1); }
    catch (e) { setError(e.message); } finally { setLocating(false); }
  };

  return (
    <div className="stack">
      <div className="row between">
        <div>
          <h1>Find an animal who needs a home</h1>
          <p className="muted" style={{ margin: 0 }}>Adopt or foster from verified shelters and caregivers near you.</p>
        </div>
        {user?.role === 'adopter' && (
          <div className="tabs" style={{ margin: 0, border: 0 }}>
            <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>All animals</button>
            <button className={view === 'matches' ? 'active' : ''} onClick={() => setView('matches')}>Matched for you</button>
          </div>
        )}
      </div>

      {view === 'all' && <FilterBar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onLocate={locate} locating={locating} />}
      {view === 'matches' && <p className="muted small">Ranked using your lifestyle preferences. Update them on your <Link to="/profile">profile</Link>.</p>}
      {error && <div className="alert error">{error}</div>}

      {loading ? <p className="empty">Loading…</p> : data.animals.length === 0 ? (
        <p className="empty">No animals match these filters. Try widening your search radius or clearing a filter.</p>
      ) : (
        <div className="grid">{data.animals.map((a) => <AnimalCard key={a._id} animal={a} />)}</div>
      )}

      {data.pages > 1 && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn secondary sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="muted small">Page {page} of {data.pages}</span>
          <button className="btn secondary sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
