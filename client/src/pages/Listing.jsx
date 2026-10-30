import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, ShieldCheck, Users, BedDouble, DoorOpen, Soup, MapPin, Landmark, Lock, Check, Minus, Flag } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Button from '../components/Button.jsx';
import Photo from '../components/Photo.jsx';
import { Loading, ErrorBox } from '../components/State.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Stars from '../components/Stars.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { CHECKLIST, SAFETY, answer, toneWord, taka } from '../lib/listing.js';
import { fmtDay } from '../lib/booking.js';

const accuracyText = { yes: 'Checklist was accurate', mostly: 'Checklist mostly accurate', no: 'Checklist was not accurate' };
const accuracyTone = { yes: 'good', mostly: 'warn', no: 'bad' };

const SAVED_KEY = 'otithi_saved';
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
};

// Grid spans for the right half of the gallery, by how many side photos there are
const tileSpan = (count, i) => {
  if (count === 1) return 'md:col-span-2 md:row-span-2';
  if (count === 2) return 'md:col-span-2';
  if (count === 3 && i === 0) return 'md:col-span-2';
  return '';
};

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// 04 · Room listing
export default function Listing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: l, loading, error } = useApi(`/listings/${id}`);
  const [saved, setSaved] = useState(() => readSaved().includes(id));
  const [req, setReq] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [reporting, setReporting] = useState(false);
  const { data: reviews } = useApi(`/reviews/listing/${id}`);

  if (loading) return <Loading />;
  if (error) return <div className="wrap py-10"><ErrorBox message={error} /></div>;

  const v = l.village;
  const photos = l.photos || [];
  const nights = Math.max(0, Math.round((new Date(req.checkOut) - new Date(req.checkIn)) / 86400000)) || 0;

  const toggleSave = () => {
    const list = readSaved();
    const next = saved ? list.filter((x) => x !== id) : [...list, id];
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    setSaved(!saved);
  };

  const onRequest = (e) => {
    e.preventDefault();
    const qs = new URLSearchParams({ checkIn: req.checkIn, checkOut: req.checkOut, guests: req.guests });
    navigate(`/booking/${id}?${qs}`);
  };

  const canRequest = !user || user.role === 'traveller';

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      {l.status !== 'approved' && (
        <p className="rounded-xl bg-mustard-soft px-4 py-3 text-sm font-semibold text-[#4A3A10]" role="status">
          This room is <strong>{l.status}</strong> — only you{user?.role === 'admin' ? ' (admin)' : ' and the admin'} can see it.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="text-sm text-muted">
            <Link to={`/browse?district=${v?.district?._id}`}>{v?.district?.name}</Link> › <Link to={`/village/${v?._id}`}>{v?.name}</Link> › {l.host?.name}&apos;s house
          </div>
          <h1 className="text-3xl font-extrabold md:text-4xl">{l.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
            <Stars rating={l.rating} />
            <span>{v?.name}, {v?.area} · {v?.district?.name}</span>
            {l.rating?.count > 0 && <span className="font-semibold text-paddy">{l.rating.accuratePct}% say the checklist was accurate</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={toggleSave} aria-pressed={saved}>
            <Heart size={18} aria-hidden="true" className={saved ? 'fill-danger text-danger' : ''} />{saved ? 'Saved' : 'Save'}
          </Button>
          {l.status === 'approved' && user?._id !== l.host?._id && (
            <Button variant="ghost" onClick={() => (user ? setReporting(true) : navigate('/login', { state: { from: `/listing/${id}` } }))}>
              <Flag size={18} aria-hidden="true" />Report
            </Button>
          )}
        </div>
      </div>
      {reporting && <ReportDialog listing={id} against={`${l.host?.name}'s room`} onClose={() => setReporting(false)} />}

      {/* Gallery */}
      {photos.length < 2 ? (
        <div className="h-72 overflow-hidden rounded-card md:h-[420px]">
          <Photo src={photos[0]} alt={l.title} label={photos[0] ? null : 'No photo yet'} />
        </div>
      ) : (
        // Main photo on the left half; the next 1–4 photos fill the right half
        <div className="grid h-72 gap-3 overflow-hidden rounded-card md:h-[420px] md:grid-cols-4 md:grid-rows-2">
          <div className="md:col-span-2 md:row-span-2"><Photo src={photos[0]} alt={l.title} /></div>
          {photos.slice(1, 5).map((p, i, rest) => (
            <div key={p} className={`hidden md:block ${tileSpan(rest.length, i)}`}><Photo src={p} alt={`${l.title} photo ${i + 2}`} /></div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          {/* Host */}
          <Card className="flex flex-wrap items-center gap-4 p-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mustard-soft font-display text-lg font-bold text-mustard-ink">{initials(l.host?.name)}</span>
            <div className="flex-1">
              <div className="font-bold">Hosted by {l.host?.name}</div>
              <div className="text-sm text-muted">Host since {new Date(l.host?.createdAt).getFullYear()}</div>
            </div>
            {l.host?.status === 'approved' && <Chip tone="good"><ShieldCheck size={14} aria-hidden="true" />ID verified by admin</Chip>}
          </Card>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            <span className="flex items-center gap-1.5"><DoorOpen size={18} aria-hidden="true" />{l.rooms} room{l.rooms > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1.5"><Users size={18} aria-hidden="true" />Sleeps {l.capacity}</span>
            {l.beds && <span className="flex items-center gap-1.5"><BedDouble size={18} aria-hidden="true" />{l.beds}</span>}
            {l.meals && <span className="flex items-center gap-1.5"><Soup size={18} aria-hidden="true" />Home-cooked meals on request</span>}
          </div>
          {l.description && <p className="text-lg">{l.description}</p>}

          {/* Checklist */}
          <Card stitch className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold">Honest condition checklist</h2>
                <p className="text-muted">What to expect — answered by the host</p>
              </div>
              <Chip tone="good"><ShieldCheck size={14} aria-hidden="true" />Checked by admin</Chip>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {CHECKLIST.map(({ key, label, icon: Icon }) => {
                const a = answer(key, l.checklist?.[key]);
                return (
                  <div key={key} className="flex items-center gap-3 rounded-2xl bg-ground p-3.5">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white text-paddy"><Icon size={22} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <dt className="text-sm text-muted">{label}</dt>
                      <dd className="font-bold">{a.label}</dd>
                    </div>
                    <Chip tone={a.tone}>{toneWord[a.tone]}</Chip>
                  </div>
                );
              })}
            </dl>
          </Card>

          {/* Safety */}
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="text-xl font-bold">Household &amp; safety</h2>
            <ul className="flex flex-col gap-2">
              {SAFETY.map((s) => {
                const yes = l.safety?.[s.key];
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${yes ? 'bg-paddy-soft text-paddy' : 'bg-neutral-soft text-neutral-ink'}`}>
                      {yes ? <Check size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
                    </span>
                    <span className="flex-1">{s.label}</span>
                    <span className="font-semibold">{yes ? 'Yes' : 'No'}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Directions */}
          <Card stitch className="flex flex-col gap-3 p-6">
            <h2 className="text-xl font-bold">Directions by landmark</h2>
            <div className="flex flex-wrap gap-5">
              <span className="flex items-center gap-1.5"><Landmark size={18} aria-hidden="true" />Nearest landmark: <strong>{l.nearestLandmark}</strong></span>
              {l.nearestBazar && <span className="flex items-center gap-1.5"><MapPin size={18} aria-hidden="true" />Nearest bazar: <strong>{l.nearestBazar}</strong></span>}
            </div>
            {l.canSeeDirections ? (
              <p className="rounded-xl bg-ground p-4 italic">“{l.directions}”</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted"><Lock size={16} aria-hidden="true" />Full directions and the host&apos;s phone number are shared after your request is accepted.</p>
            )}
          </Card>

          {l.houseRules?.length > 0 && (
            <Card className="flex flex-col gap-3 p-6">
              <h2 className="text-xl font-bold">House rules</h2>
              <ul className="list-disc space-y-1 pl-5">{l.houseRules.map((r) => <li key={r}>{r}</li>)}</ul>
            </Card>
          )}

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Reviews</h2>
              <Stars rating={l.rating} className="text-lg" />
            </div>
            {!reviews?.reviews.length && <p className="text-muted">No reviews yet. Guests can review after their stay.</p>}
            <ul className="flex flex-col gap-5">
              {reviews?.reviews.map((r) => (
                <li key={r._id} className="flex flex-col gap-2 border-t border-line pt-4 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paddy-soft text-sm font-bold text-paddy">{initials(r.author?.name)}</span>
                    <span className="flex-1">
                      <span className="block font-semibold">{r.author?.name}</span>
                      <span className="text-sm text-muted">Stayed {fmtDay(r.booking?.checkIn, { month: 'short', year: 'numeric' })} · {r.booking?.guests} guest{r.booking?.guests > 1 ? 's' : ''}</span>
                    </span>
                    <Stars rating={{ avg: r.rating, count: 1 }} showCount={false} />
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                  <Chip tone={accuracyTone[r.checklistAccurate]} className="self-start">{accuracyText[r.checklistAccurate]}</Chip>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Request box */}
        <aside className="w-full lg:sticky lg:top-6 lg:w-[360px] lg:flex-none">
          <Card as="form" onSubmit={onRequest} className="flex flex-col gap-4 p-6">
            <div><strong className="font-display text-3xl text-paddy">{taka(l.pricePerNight)}</strong><span className="text-muted"> / night · sleeps {l.capacity}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="r-in">Check-in</label>
                <input id="r-in" type="date" required className="input" value={req.checkIn} onChange={(e) => setReq({ ...req, checkIn: e.target.value })} /></div>
              <div><label className="label" htmlFor="r-out">Check-out</label>
                <input id="r-out" type="date" required className="input" value={req.checkOut} min={req.checkIn} onChange={(e) => setReq({ ...req, checkOut: e.target.value })} /></div>
            </div>
            <div><label className="label" htmlFor="r-guests">Guests</label>
              <select id="r-guests" className="input" value={req.guests} onChange={(e) => setReq({ ...req, guests: e.target.value })}>
                {Array.from({ length: l.capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
              </select></div>
            <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-[15px]">
              <div className="flex justify-between"><dt>{taka(l.pricePerNight)} × {nights} night{nights === 1 ? '' : 's'}</dt><dd>{taka(l.pricePerNight * nights)}</dd></div>
              <div className="flex justify-between"><dt>Platform fee</dt><dd>৳0</dd></div>
              <div className="flex justify-between font-bold"><dt>Pay host in cash</dt><dd>{taka(l.pricePerNight * nights)}</dd></div>
            </dl>
            <Button type="submit" size="lg" disabled={!canRequest || l.status !== 'approved' || nights < 1}>Send booking request</Button>
            <p className="text-[13px] text-muted">No online payment. You&apos;ll get a booking code when the host accepts — show it on arrival and pay in cash.</p>
            <p className="text-[13px] text-muted">Only verified travellers can send requests.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
