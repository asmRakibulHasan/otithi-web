import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock } from 'lucide-react';
import api from '../../api/axios.js';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import Photo from '../../components/Photo.jsx';
import ReviewForm from '../../components/ReviewForm.jsx';
import { Loading, ErrorBox, Empty } from '../../components/State.jsx';
import { taka, errorMessage } from '../../lib/listing.js';
import { fmtRange, STATUS, isPast } from '../../lib/booking.js';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', match: (b) => ['requested', 'accepted'].includes(b.status) },
  { key: 'completed', label: 'Completed', match: (b) => b.status === 'completed' },
  { key: 'cancelled', label: 'Cancelled', match: (b) => ['cancelled', 'declined'].includes(b.status) },
];

function useSavedRooms() {
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem('otithi_saved')) || []; } catch { /* storage blocked */ }
    Promise.all(ids.map((id) => api.get(`/listings/${id}`).then((r) => r.data).catch(() => null)))
      .then((list) => setRooms(list.filter(Boolean)));
  }, []);
  return rooms;
}

// 07 · Traveller dashboard
export default function TravellerDashboard() {
  const { user } = useAuth();
  const { data: bookings, loading, error, reload } = useApi('/bookings/mine');
  const [tab, setTab] = useState('upcoming');
  const [actionError, setActionError] = useState('');
  const [reviewing, setReviewing] = useState(null); // booking id
  const saved = useSavedRooms();

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setActionError('');
    try {
      await api.put(`/bookings/${id}/cancel`);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const current = TABS.find((t) => t.key === tab);
  const list = (bookings || []).filter(current.match);
  // Upcoming soonest first; history newest first
  if (tab === 'upcoming') list.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">My bookings</span>
          <h1 className="text-4xl font-extrabold">Assalamu alaikum, {user?.name?.split(' ')[0]}</h1>
        </div>
        {user?.status === 'approved'
          ? <Chip tone="good"><ShieldCheck size={14} aria-hidden="true" />Verified traveller</Chip>
          : <Chip tone="warn"><Clock size={14} aria-hidden="true" />Verification pending</Chip>}
      </div>

      <div className="flex self-start rounded-xl bg-[#EEE8DC] p-1" role="tablist" aria-label="Bookings">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`min-h-[40px] rounded-[9px] px-4 font-semibold ${tab === t.key ? 'bg-white shadow-sm' : 'hover:bg-sand'}`}>
            {t.label} ({(bookings || []).filter(t.match).length})
          </button>
        ))}
      </div>

      <ErrorBox message={error || actionError} />
      {loading && <Loading />}
      {!loading && list.length === 0 && (
        <Empty title={tab === 'upcoming' ? 'No upcoming stays' : `No ${tab} bookings`}>
          {tab === 'upcoming' && <Link to="/browse">Find a village stay</Link>}
        </Empty>
      )}

      <div className="flex flex-col gap-4">
        {list.map((b) => {
          const s = STATUS[b.status];
          const l = b.listing;
          return (
            <Card key={b._id} className="flex flex-wrap overflow-hidden">
              <div className="h-40 w-full sm:h-auto sm:w-48"><Photo src={l?.photos?.[0]} alt={l?.title} /></div>
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-2"><Chip tone={s.tone}>{s.label}</Chip><span className="text-sm text-muted">{fmtRange(b.checkIn, b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''}</span></div>
                <h2 className="text-lg font-bold leading-snug">{l?.title}</h2>
                <p className="text-sm text-muted">{b.host?.name}&apos;s house, {l?.village?.name} · {b.guests} guest{b.guests > 1 ? 's' : ''} · {taka(b.totalPrice)} cash to host</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" to={`/bookings/${b._id}`}>View booking</Button>
                  {['requested', 'accepted'].includes(b.status) && !isPast(b.checkIn) && (
                    <Button variant="danger" onClick={() => cancel(b._id)}>Cancel</Button>
                  )}
                  {b.status === 'completed' && !b.reviewedByMe && reviewing !== b._id && (
                    <Button variant="accent" onClick={() => setReviewing(b._id)}>Write a review</Button>
                  )}
                  {b.status === 'completed' && b.reviewedByMe && <Chip tone="good">Reviewed</Chip>}
                </div>
                {reviewing === b._id && (
                  <div className="mt-3 border-t border-line pt-4">
                    <p className="mb-3 font-semibold">How was {l?.village?.name} with {b.host?.name}?</p>
                    <ReviewForm bookingId={b._id} asGuest onCancel={() => setReviewing(null)} onDone={() => { setReviewing(null); reload(); }} />
                  </div>
                )}
              </div>
              {tab === 'upcoming' && (
                <div className="stitch flex w-full flex-col items-center justify-center gap-1 bg-[#FFFDF7] p-6 text-center sm:w-56">
                  <span className="text-sm text-muted">Booking code</span>
                  <span className={`font-display text-3xl font-extrabold tracking-wider ${b.code ? 'text-paddy' : 'text-[#B0A894]'}`}>{b.code || '— — —'}</span>
                  <span className="text-[13px] text-muted">{b.code ? 'Show on arrival' : 'Appears when the host accepts'}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <section className="flex flex-col gap-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Saved rooms</h2>
          <Link to="/browse?view=room">Find more</Link>
        </div>
        {saved.length === 0 && <p className="text-muted">Tap “Save” on a room to keep it here.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((r) => (
            <Card key={r._id} as={Link} to={`/listing/${r._id}`} className="flex gap-3 p-3 text-ink no-underline hover:text-ink hover:shadow-lg">
              <div className="h-20 w-24 flex-none overflow-hidden rounded-xl"><Photo src={r.photos?.[0]} alt={r.title} /></div>
              <div className="min-w-0">
                <div className="truncate font-bold">{r.title}</div>
                <div className="text-sm text-muted">{r.village?.name}, {r.village?.district?.name}</div>
                <div className="text-sm font-semibold text-paddy">{taka(r.pricePerNight)} / night</div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
