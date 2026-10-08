import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { animals, errMsg } from '../api.js';
import { SPECIES, SIZES, TEMPERAMENTS, cap, getPosition } from '../utils.js';

const BLANK = {
  name: '', species: 'dog', breed: '', gender: 'male', ageMonths: 12, size: 'medium', energy: 'medium', description: '',
  listingType: 'adopt', city: '', lat: '', lng: '', temperament: [],
  goodKids: false, goodDogs: false, goodCats: false, vaccinated: false, neutered: false, microchipped: false, healthNotes: '', status: 'available',
};

export default function AnimalForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState(BLANK);
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [remove, setRemove] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    animals.get(id).then(({ animal: a }) => {
      setExisting(a.photos);
      setF({
        ...BLANK, ...a, healthNotes: a.health?.notes || '', vaccinated: !!a.health?.vaccinated, neutered: !!a.health?.neutered, microchipped: !!a.health?.microchipped,
        goodKids: !!a.goodWith?.kids, goodDogs: !!a.goodWith?.dogs, goodCats: !!a.goodWith?.cats,
        lat: a.location?.coordinates?.[1] ?? '', lng: a.location?.coordinates?.[0] ?? '',
      });
    }).catch((e) => setError(errMsg(e)));
  }, [id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleTag = (t) => setF({ ...f, temperament: f.temperament.includes(t) ? f.temperament.filter((x) => x !== t) : [...f.temperament, t] });
  const locate = async () => { try { const { lat, lng } = await getPosition(); setF((s) => ({ ...s, lat, lng })); } catch (e) { setError(e.message); } };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData();
    ['name', 'species', 'breed', 'gender', 'ageMonths', 'size', 'energy', 'description', 'listingType', 'city', 'lat', 'lng', 'healthNotes', 'goodKids', 'goodDogs', 'goodCats', 'vaccinated', 'neutered', 'microchipped', 'status']
      .forEach((k) => fd.append(k, f[k] ?? ''));
    fd.append('temperament', f.temperament.join(','));
    fd.append('removePhotos', remove.join(','));
    files.forEach((file) => fd.append('photos', file));
    try {
      const { animal } = id ? await animals.update(id, fd) : await animals.create(fd);
      nav(`/animals/${animal._id}`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="stack" style={{ maxWidth: 760 }}>
      <h1>{id ? 'Edit listing' : 'List an animal'}</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="card stack">
        <h2>Basics</h2>
        <div className="grid-2">
          <div><label>Name</label><input required value={f.name} onChange={set('name')} /></div>
          <div><label>Listed for</label>
            <select value={f.listingType} onChange={set('listingType')}><option value="adopt">Adoption</option><option value="foster">Foster</option><option value="both">Adoption or foster</option></select>
          </div>
          <div><label>Species</label><select value={f.species} onChange={set('species')}>{SPECIES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></div>
          <div><label>Breed</label><input value={f.breed} onChange={set('breed')} /></div>
          <div><label>Gender</label><select value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option></select></div>
          <div><label>Age (months)</label><input type="number" min="0" required value={f.ageMonths} onChange={set('ageMonths')} /></div>
          <div><label>Size</label><select value={f.size} onChange={set('size')}>{SIZES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></div>
          <div><label>Energy level</label><select value={f.energy} onChange={set('energy')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        </div>
        <div><label>Description</label><textarea value={f.description} onChange={set('description')} /></div>
        {id && <div><label>Status</label>
          <select value={f.status} onChange={set('status')}>{['available', 'pending', 'adopted', 'fostered', 'unavailable'].map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select>
        </div>}
      </div>

      <div className="card stack">
        <h2>Temperament and compatibility</h2>
        <div>{TEMPERAMENTS.map((t) => <label key={t} className="check"><input type="checkbox" checked={f.temperament.includes(t)} onChange={() => toggleTag(t)} /> {cap(t)}</label>)}</div>
        <div>
          <label className="check"><input type="checkbox" checked={f.goodKids} onChange={set('goodKids')} /> Good with children</label>
          <label className="check"><input type="checkbox" checked={f.goodDogs} onChange={set('goodDogs')} /> Good with dogs</label>
          <label className="check"><input type="checkbox" checked={f.goodCats} onChange={set('goodCats')} /> Good with cats</label>
        </div>
      </div>

      <div className="card stack">
        <h2>Health</h2>
        <div>
          <label className="check"><input type="checkbox" checked={f.vaccinated} onChange={set('vaccinated')} /> Vaccinated</label>
          <label className="check"><input type="checkbox" checked={f.neutered} onChange={set('neutered')} /> Neutered / spayed</label>
          <label className="check"><input type="checkbox" checked={f.microchipped} onChange={set('microchipped')} /> Microchipped</label>
        </div>
        <div><label>Health notes</label><textarea value={f.healthNotes} onChange={set('healthNotes')} /></div>
        {id && <p className="muted small">Add dated vaccination and treatment records from the animal's page after saving.</p>}
      </div>

      <div className="card stack">
        <h2>Photos and location</h2>
        {existing.length > 0 && (
          <div className="gallery">{existing.map((p) => (
            <div key={p}>
              <img src={p} alt="" style={{ opacity: remove.includes(p) ? 0.3 : 1 }} />
              <label className="check small"><input type="checkbox" checked={remove.includes(p)} onChange={() => setRemove(remove.includes(p) ? remove.filter((x) => x !== p) : [...remove, p])} /> Remove</label>
            </div>
          ))}</div>
        )}
        <div><label>Add photos (up to 6, JPG/PNG/WebP, 5 MB each)</label><input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 6))} /></div>
        <div className="grid-2">
          <div><label>City</label><input value={f.city} onChange={set('city')} /></div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <button type="button" className="btn secondary" onClick={locate}>Use current location</button>
            <span className="muted small">{f.lat !== '' ? 'Location set' : 'Defaults to your profile location'}</span>
          </div>
        </div>
      </div>

      <div className="row"><button className="btn" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Publish listing'}</button></div>
    </form>
  );
}
