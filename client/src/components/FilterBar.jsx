import { SPECIES, SIZES, cap } from '../utils.js';

export default function FilterBar({ filters, onChange, onLocate, locating }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });
  return (
    <form className="card filters" onSubmit={(e) => e.preventDefault()}>
      <div><label htmlFor="q">Search</label><input id="q" placeholder="Name, breed…" value={filters.q} onChange={set('q')} /></div>
      <div>
        <label htmlFor="species">Species</label>
        <select id="species" value={filters.species} onChange={set('species')}>
          <option value="">Any</option>{SPECIES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select>
      </div>
      <div><label htmlFor="breed">Breed</label><input id="breed" value={filters.breed} onChange={set('breed')} /></div>
      <div>
        <label htmlFor="size">Size</label>
        <select id="size" value={filters.size} onChange={set('size')}>
          <option value="">Any</option>{SIZES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="age">Age</label>
        <select id="age" value={filters.age} onChange={set('age')}>
          <option value="">Any</option><option value="0-12">Under 1 year</option><option value="12-60">1–5 years</option><option value="60-300">5+ years</option>
        </select>
      </div>
      <div>
        <label htmlFor="lt">For</label>
        <select id="lt" value={filters.listingType} onChange={set('listingType')}>
          <option value="">Adoption or foster</option><option value="adopt">Adoption</option><option value="foster">Foster</option>
        </select>
      </div>
      <div>
        <label htmlFor="radius">Within</label>
        <select id="radius" value={filters.radius} onChange={set('radius')} disabled={!filters.lat}>
          {[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} km</option>)}
        </select>
      </div>
      <div className="row">
        <button type="button" className="btn secondary" onClick={onLocate} disabled={locating}>{filters.lat ? 'Update location' : 'Use my location'}</button>
        <label className="check" style={{ margin: 0 }}>
          <input type="checkbox" checked={filters.verified} onChange={(e) => onChange({ ...filters, verified: e.target.checked })} /> Verified only
        </label>
      </div>
    </form>
  );
}
