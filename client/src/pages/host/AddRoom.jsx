import { useEffect, useMemo, useState } from 'react';
import { Check, ImagePlus, X, Clock } from 'lucide-react';
import api from '../../api/axios.js';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import { ErrorBox } from '../../components/State.jsx';
import { CHECKLIST, SAFETY, answer, errorMessage } from '../../lib/listing.js';

const STEPS = [
  { t: 'Room details', d: 'Title, price, capacity' },
  { t: 'Photos', d: 'Up to 10 photos' },
  { t: 'Condition checklist', d: '6 short questions' },
  { t: 'Directions & safety', d: 'Landmarks, household' },
];

const MAX_PHOTOS = 10;

// 09 · Host — add room wizard
export default function AddRoom() {
  const { user } = useAuth();
  const { data: villages } = useApi('/villages');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [photos, setPhotos] = useState([]); // { file, url }

  const [form, setForm] = useState({
    title: '', description: '', village: user?.village || '', pricePerNight: '', capacity: '', rooms: 1, beds: '', meals: false,
    checklist: {}, safety: {}, directions: '', nearestLandmark: '', nearestBazar: '', houseRules: '',
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Prefill landmark/bazar from the chosen village
  useEffect(() => {
    const v = villages?.find((x) => x._id === form.village);
    if (v) setForm((f) => ({ ...f, nearestLandmark: f.nearestLandmark || v.landmark, nearestBazar: f.nearestBazar || v.nearestBazar }));
  }, [form.village, villages]);

  // Free preview URLs when leaving the page
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const byDistrict = useMemo(() => {
    const groups = {};
    (villages || []).forEach((v) => (groups[v.district?.name] ||= []).push(v));
    return Object.entries(groups);
  }, [villages]);

  const addPhotos = (e) => {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length);
    setPhotos([...photos, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    e.target.value = '';
  };
  const removePhoto = (i) => {
    URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, j) => j !== i));
  };

  // Returns an error message for the current step, or ''
  const check = (s) => {
    if (s === 0) {
      if (!form.title.trim()) return 'Add a title for your room';
      if (!form.village) return 'Choose your village';
      if (!(Number(form.pricePerNight) > 0)) return 'Add a price per night';
      if (!(Number(form.capacity) > 0)) return 'How many guests can sleep here?';
    }
    if (s === 1 && photos.length === 0) return 'Add at least one photo';
    if (s === 2) {
      const missing = CHECKLIST.find((c) => !form.checklist[c.key]);
      if (missing) return `Answer: ${missing.question}`;
    }
    if (s === 3) {
      if (!form.directions.trim()) return 'Write directions from the nearest bazar';
      if (!form.nearestLandmark.trim()) return 'Add the nearest landmark';
    }
    return '';
  };

  const next = () => {
    const msg = check(step);
    setError(msg);
    if (!msg) setStep(step + 1);
  };

  const submit = async () => {
    const msg = check(3);
    if (msg) return setError(msg);
    setBusy(true);
    setError('');
    try {
      const data = new FormData();
      ['title', 'description', 'village', 'pricePerNight', 'capacity', 'rooms', 'beds', 'meals', 'directions', 'nearestLandmark', 'nearestBazar']
        .forEach((k) => data.append(k, form[k]));
      data.append('checklist', JSON.stringify(form.checklist));
      data.append('safety', JSON.stringify(form.safety));
      data.append('houseRules', JSON.stringify(form.houseRules.split('\n').map((r) => r.trim()).filter(Boolean)));
      photos.forEach((p) => data.append('photos', p.file));
      await api.post('/listings', data);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (user?.status !== 'approved') {
    return (
      <div className="wrap py-16">
        <Card stitch className="mx-auto flex max-w-xl flex-col gap-3 p-10">
          <h1 className="text-3xl font-extrabold">Verification first</h1>
          <p className="text-muted">You can add rooms once the admin has approved your ID. This usually takes a day.</p>
          <Button variant="outline" to="/host" className="self-start">Back to dashboard</Button>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="wrap py-16">
        <Card stitch className="mx-auto flex max-w-xl flex-col items-start gap-4 p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mustard-soft text-mustard-ink"><Clock size={26} aria-hidden="true" /></span>
          <h1 className="text-3xl font-extrabold">Sent to the admin for review</h1>
          <p className="text-muted">Your room becomes visible to travellers once it is approved — usually within a day.</p>
          <div className="flex gap-3"><Button to="/host">Go to dashboard</Button><Button variant="outline" onClick={() => window.location.reload()}>Add another room</Button></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      <div>
        <h1 className="text-4xl font-extrabold">Add a room</h1>
        <p className="text-muted">Tell guests the real condition — honest answers get better reviews.</p>
      </div>

      {/* Stepper */}
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.t} className={`flex items-center gap-3 rounded-2xl border p-3 ${i === step ? 'border-paddy bg-white' : 'border-line'}`} aria-current={i === step ? 'step' : undefined}>
            <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-bold ${i < step ? 'bg-paddy text-white' : i === step ? 'bg-mustard text-ink' : 'bg-neutral-soft text-neutral-ink'}`}>
              {i < step ? <Check size={18} aria-hidden="true" /> : i + 1}
            </span>
            <span><span className="block font-bold">{s.t}</span><span className="text-sm text-muted">{s.d}</span></span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-start gap-8">
        <Card className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 p-6 md:p-8">
          {step === 0 && (
            <>
              <div><label className="label" htmlFor="f-title">Room title</label>
                <input id="f-title" className="input" maxLength={100} placeholder="e.g. Tin-roof family home beside the mango tree" value={form.title} onChange={set('title')} /></div>
              <div><label className="label" htmlFor="f-village">Village</label>
                <select id="f-village" className="input" value={form.village} onChange={set('village')}>
                  <option value="">Choose your village</option>
                  {byDistrict.map(([district, list]) => (
                    <optgroup key={district} label={district}>{list.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}</optgroup>
                  ))}
                </select></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className="label" htmlFor="f-price">Price per night (৳)</label>
                  <input id="f-price" type="number" min="1" className="input" value={form.pricePerNight} onChange={set('pricePerNight')} /></div>
                <div><label className="label" htmlFor="f-cap">Guests it sleeps</label>
                  <input id="f-cap" type="number" min="1" className="input" value={form.capacity} onChange={set('capacity')} /></div>
                <div><label className="label" htmlFor="f-rooms">Number of rooms</label>
                  <input id="f-rooms" type="number" min="1" className="input" value={form.rooms} onChange={set('rooms')} /></div>
              </div>
              <div><label className="label" htmlFor="f-beds">Beds</label>
                <input id="f-beds" className="input" placeholder="e.g. 2 double beds" value={form.beds} onChange={set('beds')} /></div>
              <div><label className="label" htmlFor="f-desc">Description</label>
                <textarea id="f-desc" rows={4} className="input py-3" value={form.description} onChange={set('description')}
                  placeholder="What is the house like? Who lives there? What can guests see nearby?" /></div>
              <label className="flex items-center gap-2.5"><input type="checkbox" className="h-5 w-5 accent-paddy" checked={form.meals} onChange={set('meals')} />Home-cooked meals on request</label>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-muted">Show the room, the toilet, the courtyard and the way in. Honest photos avoid bad reviews.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((p, i) => (
                  <div key={p.url} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white">
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#C9BFA9] bg-[#FFFDF7] text-center text-sm font-semibold hover:border-paddy">
                    <ImagePlus size={24} aria-hidden="true" />Add photos
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={addPhotos} />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted">{photos.length} of {MAX_PHOTOS} · JPG, PNG or WEBP, up to 5 MB each</p>
            </>
          )}

          {step === 2 && CHECKLIST.map((c) => (
            <fieldset key={c.key} className="flex flex-col gap-2">
              <legend className="mb-2 font-bold">{c.question}</legend>
              <div className="flex flex-wrap gap-2">
                {c.options.map((o) => {
                  const on = form.checklist[c.key] === o.value;
                  return (
                    <label key={o.value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] px-4 font-semibold ${on ? 'border-paddy bg-paddy-soft text-paddy' : 'border-field bg-white'}`}>
                      <input type="radio" name={c.key} value={o.value} checked={on} className="sr-only"
                        onChange={() => setForm({ ...form, checklist: { ...form.checklist, [c.key]: o.value } })} />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {step === 3 && (
            <>
              <div><label className="label" htmlFor="f-dir">Directions in your own words</label>
                <textarea id="f-dir" rows={4} className="input py-3" value={form.directions} onChange={set('directions')}
                  placeholder="From Jaflong Bazar, take a CNG toward Sangrampunji, get down at the blue mosque, walk five minutes north — white tin-roof house beside the mango tree." />
                <p className="mt-1 text-[13px] text-muted">Guests see this only after you accept their request.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="f-land">Nearest landmark</label>
                  <input id="f-land" className="input" value={form.nearestLandmark} onChange={set('nearestLandmark')} /></div>
                <div><label className="label" htmlFor="f-bazar">Nearest bazar</label>
                  <input id="f-bazar" className="input" value={form.nearestBazar} onChange={set('nearestBazar')} /></div>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 font-bold">Household &amp; safety</legend>
                {SAFETY.map((s) => (
                  <label key={s.key} className="flex min-h-9 items-center gap-2.5">
                    <input type="checkbox" className="h-5 w-5 accent-paddy" checked={Boolean(form.safety[s.key])}
                      onChange={(e) => setForm({ ...form, safety: { ...form.safety, [s.key]: e.target.checked } })} />
                    {s.label}
                  </label>
                ))}
              </fieldset>
              <div><label className="label" htmlFor="f-rules">House rules (one per line)</label>
                <textarea id="f-rules" rows={4} className="input py-3" value={form.houseRules} onChange={set('houseRules')}
                  placeholder={'Please be back inside by 10 pm\nNo smoking inside the house'} /></div>
            </>
          )}

          <ErrorBox message={error} />

          <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
            {step > 0 ? <Button variant="ghost" onClick={() => { setError(''); setStep(step - 1); }}>← Back to {STEPS[step - 1].t.toLowerCase()}</Button> : <span />}
            {step < 3
              ? <Button onClick={next}>Next: {STEPS[step + 1].t} →</Button>
              : <Button onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Submit for admin review'}</Button>}
          </div>
        </Card>

        {/* Live preview of the checklist */}
        <aside className="w-full lg:sticky lg:top-6 lg:w-[320px] lg:flex-none">
          <Card stitch className="flex flex-col gap-3 p-6">
            <span className="eyebrow">Live preview</span>
            <h2 className="text-lg font-bold">How guests will see it</h2>
            <ul className="flex flex-col gap-2">
              {CHECKLIST.map((c) => {
                const a = form.checklist[c.key] ? answer(c.key, form.checklist[c.key]) : null;
                return (
                  <li key={c.key} className="flex items-center justify-between gap-2 text-[15px]">
                    <span>{c.label}</span>
                    {a ? <Chip tone={a.tone}>{a.label}</Chip> : <span className="text-sm text-muted">Not answered</span>}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-line pt-3 text-[13px] text-muted">After step 4 your room goes to the admin for review. It becomes visible once approved.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
