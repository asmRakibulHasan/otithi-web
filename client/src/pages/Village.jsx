import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Landmark, ShieldCheck, Users, Check, X } from 'lucide-react';
import api from '../api/axios.js';
import useApi from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Button from '../components/Button.jsx';
import Photo from '../components/Photo.jsx';
import { Loading, ErrorBox, Empty } from '../components/State.jsx';
import { answer, taka, errorMessage } from '../lib/listing.js';
import { nightsBetween, todayInput } from '../lib/booking.js';

// Spread the group over the chosen houses, biggest first. Houses not needed get 0.
function allocate(houses, guests) {
  let left = guests;
  return [...houses].sort((a, b) => b.capacity - a.capacity).map((h) => {
    const n = Math.min(h.capacity, left);
    left -= n;
    return { listing: h, guests: n };
  });
}

// 03 · Village page — all host households in one village + group stay planner
export default function Village() {
  const { id } = useParams();
  const { data: village, loading, error } = useApi(`/villages/${id}`);
  const [selected, setSelected] = useState([]);
  const [plan, setPlan] = useState({ checkIn: '', checkOut: '', guests: '' });
  const [results, setResults] = useState(null); // [{ name, ok, message }]
  const [planError, setPlanError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <Loading />;
  if (error) return <div className="wrap py-10"><ErrorBox message={error} /></div>;

  const { stats, listings } = village;
  const picked = listings.filter((l) => selected.includes(l._id));
  const capacity = picked.reduce((s, l) => s + l.capacity, 0);
  const nights = nightsBetween(plan.checkIn, plan.checkOut);
  const total = picked.reduce((s, l) => s + l.pricePerNight, 0) * nights;
  const guests = Number(plan.guests) || 0;

  const sendRequests = async () => {
    setPlanError('');
    setResults(null);
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'traveller') return setPlanError('Only traveller accounts can send booking requests');
    if (user.status !== 'approved') return setPlanError('You can send requests once the admin verifies your ID');
    if (!picked.length) return setPlanError('Tick at least one house');
    if (nights < 1) return setPlanError('Choose check-in and check-out dates');
    if (!guests) return setPlanError('Enter your group size');
    if (capacity < guests) return setPlanError(`These houses sleep ${capacity}. Add another house for ${guests} guests.`);

    setBusy(true);
    const plans = allocate(picked, guests).filter((p) => p.guests > 0);
    const settled = await Promise.allSettled(plans.map((p) => api.post('/bookings', {
      listing: p.listing._id, checkIn: plan.checkIn, checkOut: plan.checkOut, guests: p.guests,
      message: `Group stay: ${guests} guests across ${plans.length} houses in ${village.name}.`,
    })));
    setResults(plans.map((p, i) => ({
      name: `${p.listing.host?.name}'s house · ${p.guests} guest${p.guests > 1 ? 's' : ''}`,
      ok: settled[i].status === 'fulfilled',
      message: settled[i].status === 'fulfilled' ? 'Request sent' : errorMessage(settled[i].reason),
    })));
    setBusy(false);
  };

  const toggle = (lid) => setSelected((s) => (s.includes(lid) ? s.filter((x) => x !== lid) : [...s, lid]));

  return (
    <div className="wrap flex flex-col gap-8 pb-16 pt-8">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted">
          <Link to={`/browse?district=${village.district?._id}`}>{village.district?.name}</Link> › {village.area}
        </div>
        <h1 className="text-4xl font-extrabold md:text-5xl">{village.name}</h1>
        <div className="flex flex-wrap gap-5 text-muted">
          <span className="flex items-center gap-1.5"><MapPin size={18} aria-hidden="true" />Nearest bazar: {village.nearestBazar}</span>
          <span className="flex items-center gap-1.5"><Landmark size={18} aria-hidden="true" />Landmark: {village.landmark}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="h-64 overflow-hidden md:h-80"><Photo src={village.photo} label={`${village.name} village`} /></Card>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Host households', stats.households],
            ['Rooms available', stats.rooms],
            ['Total guest capacity', stats.capacity],
            ['Rooms from', stats.minPrice ? taka(stats.minPrice) : '—'],
          ].map(([label, value]) => (
            <Card key={label} className="flex flex-col justify-center gap-1 p-5">
              <span className="text-sm text-muted">{label}</span>
              <span className="font-display text-3xl font-extrabold text-paddy">{value}</span>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold">Households in this village</h2>
            <p className="text-muted">Choose one house — or tick several to plan a group stay</p>
          </div>

          {listings.length === 0 && <Empty title="No rooms published here yet" />}

          {listings.map((l) => {
            const on = selected.includes(l._id);
            return (
              <Card key={l._id} className={`flex flex-wrap items-center gap-4 p-4 ${on ? 'border-paddy ring-2 ring-paddy/30' : ''}`}>
                <label className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center" title="Add to group stay">
                  <input type="checkbox" checked={on} onChange={() => toggle(l._id)} className="h-5 w-5 accent-paddy"
                    aria-label={`Add ${l.host?.name}'s house to group stay`} />
                </label>
                <div className="h-24 w-32 flex-none overflow-hidden rounded-xl"><Photo src={l.photos?.[0]} alt={l.title} /></div>
                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{l.host?.name}&apos;s house</span>
                    <Chip tone="good"><ShieldCheck size={14} aria-hidden="true" />Verified host</Chip>
                  </div>
                  <div className="text-sm text-muted">{l.title} · {l.rooms} room{l.rooms > 1 ? 's' : ''} · sleeps {l.capacity}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['toilet', 'electricity', 'road'].map((k) => {
                      const a = answer(k, l.checklist?.[k]);
                      return <Chip key={k} tone={a.tone}>{a.label}</Chip>;
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span><strong className="font-display text-xl text-paddy">{taka(l.pricePerNight)}</strong><span className="text-sm text-muted"> / night</span></span>
                  <Button variant="outline" to={`/listing/${l._id}`}>View house</Button>
                </div>
              </Card>
            );
          })}
        </section>

        <aside className="w-full lg:sticky lg:top-6 lg:w-[340px] lg:flex-none">
          <Card stitch className="flex flex-col gap-4 p-6">
            <h2 className="text-xl font-bold">Group stay planner</h2>
            <p className="text-sm text-muted">{picked.length} house{picked.length === 1 ? '' : 's'} selected</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="g-in">Check-in</label>
                <input id="g-in" type="date" min={todayInput()} className="input" value={plan.checkIn} onChange={(e) => setPlan({ ...plan, checkIn: e.target.value })} /></div>
              <div><label className="label" htmlFor="g-out">Check-out</label>
                <input id="g-out" type="date" min={plan.checkIn || todayInput()} className="input" value={plan.checkOut} onChange={(e) => setPlan({ ...plan, checkOut: e.target.value })} /></div>
            </div>
            <div><label className="label" htmlFor="g-size">Group size</label>
              <input id="g-size" type="number" min="1" className="input" value={plan.guests} onChange={(e) => setPlan({ ...plan, guests: e.target.value })} /></div>

            {picked.length > 0 && (
              <ul className="flex flex-col gap-1.5 text-sm">
                {picked.map((l) => (
                  <li key={l._id} className="flex justify-between gap-2"><span>{l.host?.name}&apos;s house</span><span className="text-muted">sleeps {l.capacity}</span></li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-1.5 border-t border-line pt-3 text-[15px]">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5"><Users size={16} aria-hidden="true" />Capacity</span>
                <span className={guests && capacity < guests ? 'font-semibold text-danger' : 'font-semibold'}>
                  {capacity}{guests ? ` ${capacity >= guests ? '≥' : '<'} ${guests} guests` : ''}
                </span>
              </div>
              <div className="flex justify-between"><span>Est. total{nights ? ` for ${nights} night${nights > 1 ? 's' : ''}` : ''}</span><strong>{nights ? taka(total) : '—'}</strong></div>
            </div>

            <Button onClick={sendRequests} disabled={busy}>
              {busy ? 'Sending…' : `Send ${picked.length || ''} booking request${picked.length === 1 ? '' : 's'}`}
            </Button>
            <ErrorBox message={planError} />
            {results && (
              <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
                {results.map((r) => (
                  <li key={r.name} className={`flex items-start gap-2 rounded-xl p-2.5 ${r.ok ? 'bg-paddy-soft text-paddy' : 'bg-danger-soft text-danger'}`}>
                    {r.ok ? <Check size={16} className="mt-0.5 flex-none" aria-hidden="true" /> : <X size={16} className="mt-0.5 flex-none" aria-hidden="true" />}
                    <span><strong>{r.name}</strong> — {r.message}</span>
                  </li>
                ))}
                {results.some((r) => r.ok) && <li><Link to="/traveller" className="font-semibold">See my bookings →</Link></li>}
              </ul>
            )}
            <p className="text-[13px] text-muted">Each host accepts separately. You&apos;ll get one booking code per house. Pay each host in cash.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
