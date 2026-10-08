import { Link } from 'react-router-dom';
import { ageLabel, cap, providerName } from '../utils.js';

export default function AnimalCard({ animal }) {
  const { _id, name, photos, species, breed, ageMonths, size, listingType, owner, distanceKm, match, status } = animal;
  return (
    <Link to={`/animals/${_id}`} className="card animal">
      <div className="photo">{photos?.[0] ? <img src={photos[0]} alt={name} loading="lazy" /> : <span>No photo yet</span>}</div>
      <div className="body">
        {match && <span className="badge match">{match.score}% match</span>}
        <h3>{name}</h3>
        <p className="muted small" style={{ margin: 0 }}>
          {cap(species)}{breed ? ` · ${breed}` : ''} · {ageLabel(ageMonths)} · {cap(size)}
        </p>
        <p className="small" style={{ margin: '.4rem 0' }}>
          <span className="badge">{listingType === 'both' ? 'Adopt or foster' : cap(listingType)}</span>{' '}
          {status && status !== 'available' && <span className="badge grey">{status}</span>}
        </p>
        <p className="muted small" style={{ margin: 0 }}>
          {providerName(owner)}{owner?.verified && <span className="verified"> ✓ Verified</span>}
          {distanceKm != null && ` · ${distanceKm} km`}
        </p>
        {match?.reasons?.length > 0 && <p className="small muted" style={{ margin: '.4rem 0 0' }}>{match.reasons.slice(0, 2).join(' • ')}</p>}
      </div>
    </Link>
  );
}
