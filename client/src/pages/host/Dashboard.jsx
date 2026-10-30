import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShieldCheck, Flag } from 'lucide-react';
import api from '../../api/axios.js';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import Photo from '../../components/Photo.jsx';
import HostCalendar from '../../components/HostCalendar.jsx';
import Stars from '../../components/Stars.jsx';
import ReviewForm from '../../components/ReviewForm.jsx';
import ReportDialog from '../../components/ReportDialog.jsx';
import { Loading, ErrorBox, Empty } from '../../components/State.jsx';
import { taka, errorMessage } from '../../lib/listing.js';
import { fmtDay, fmtRange, dayKey, todayBD } from '../../lib/booking.js';

const roomTone = { approved: 'good', pending: 'warn', rejected: 'bad' };
const roomText = { approved: 'Live', pending: 'Waiting for admin', rejected: 'Rejected' };
const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function CompleteStay({ booking, onDone }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Same rule as the server: from the check-in day (Bangladesh time)
  const canComplete = dayKey(booking.checkIn) <= todayBD();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/bookings/${booking._id}/complete`, { code });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!canComplete) return <p className="text-sm text-muted">You can mark it completed from {fmtDay(booking.checkIn)}.</p>;
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`code-${booking._id}`}>Booking code</label>
        <input id={`code-${booking._id}`} className="input max-w-[160px] uppercase tracking-wider" placeholder="OT-XXXX" value={code} onChange={(e) => setCode(e.target.value)} required />
        <Button type="submit" disabled={busy}>Mark completed</Button>
      </div>
      <ErrorBox message={error} />
    </form>
  );
}

// 08 · Host dashboard
export default function HostDashboard() {
  const { user } = useAuth();
  const rooms = useApi('/listings/mine');
  const bookings = useApi('/bookings/host');
  const [actionError, setActionError] = useState('');
  const [reviewing, setReviewing] = useState(null); // booking id
  const [reporting, setReporting] = useState(null); // booking

  const all = bookings.data || [];
  const requests = all.filter((b) => b.status === 'requested');
  const upcoming = all.filter((b) => b.status === 'accepted');
  const completed = all.filter((b) => b.status === 'completed').sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  const nights = completed.reduce((s, b) => s + b.nights, 0);
  const earned = completed.reduce((s, b) => s + b.totalPrice, 0);

  const act = async (id, action) => {
    setActionError('');
    try {
      await api.put(`/bookings/${id}/${action}`);
      bookings.reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const stats = [
    { l: 'Pending requests', v: requests.length, n: 'Reply within 24 hours' },
    { l: 'Upcoming stays', v: upcoming.length, n: upcoming[0] ? `Next: ${fmtDay(upcoming[0].checkIn)}` : 'None yet' },
    { l: 'Nights hosted', v: nights, n: `${completed.length} completed stay${completed.length === 1 ? '' : 's'}` },
    { l: 'Total earned (cash)', v: taka(earned), n: '0% commission' },
  ];

  return (
    <div className="wrap flex flex-col gap-8 pb-16 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Host dashboard</span>
          <h1 className="text-4xl font-extrabold">Assalamu alaikum, {user?.name?.split(' ')[0]}</h1>
        </div>
        {user?.status === 'approved' && <Button to="/host/add-room"><Plus size={18} aria-hidden="true" />Add a room</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.l} className="flex flex-col gap-1 p-5">
            <span className="text-sm text-muted">{s.l}</span>
            <span className="font-display text-3xl font-extrabold text-paddy">{s.v}</span>
            <span className="text-sm text-muted">{s.n}</span>
          </Card>
        ))}
      </div>

      <ErrorBox message={bookings.error || actionError} />
      {bookings.loading && <Loading />}

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
          {/* Requests */}
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">New booking requests</h2>
            {!bookings.loading && requests.length === 0 && <p className="text-muted">No new requests right now.</p>}
            {requests.map((b) => (
              <Card key={b._id} className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-mustard-soft font-bold text-mustard-ink">{initials(b.guest?.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{b.guest?.name}</span>
                      {b.guest?.status === 'approved' && <Chip tone="good"><ShieldCheck size={14} aria-hidden="true" />ID verified</Chip>}
                    </div>
                    <div className="text-sm text-muted">{fmtRange(b.checkIn, b.checkOut)} · {b.guests} guest{b.guests > 1 ? 's' : ''} · {b.listing?.title} · {taka(b.totalPrice)}</div>
                    {b.message && <p className="mt-2 rounded-xl bg-ground p-3 italic">“{b.message}”</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <span>
                      <strong>Guest history:</strong>{' '}
                      {b.guestHistory.stays ? `${b.guestHistory.stays} completed stay${b.guestHistory.stays > 1 ? 's' : ''} with ${b.guestHistory.hosts} host${b.guestHistory.hosts > 1 ? 's' : ''}` : 'First stay on Otithi'}
                    </span>
                    {b.guestHistory.reviews.count > 0 && (
                      <span className="flex flex-wrap items-center gap-2">
                        <Stars rating={b.guestHistory.reviews} /><span className="text-muted">from hosts</span>
                        {b.guestHistory.reviews.latest && <span className="italic text-muted">“{b.guestHistory.reviews.latest}”</span>}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => act(b._id, 'accept')}>Accept</Button>
                    <Button variant="danger" onClick={() => act(b._id, 'decline')}>Decline</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          {/* Upcoming */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold">Upcoming stays</h2>
              <p className="text-muted">When the guest shows their code and pays cash, enter the code to mark the stay completed.</p>
            </div>
            {!bookings.loading && upcoming.length === 0 && <p className="text-muted">No accepted stays yet.</p>}
            {upcoming.map((b) => (
              <Card key={b._id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-bold">{b.guest?.name} · {b.guests} guest{b.guests > 1 ? 's' : ''}</div>
                  <div className="text-sm text-muted">{fmtRange(b.checkIn, b.checkOut)} · {b.listing?.title}</div>
                  <div className="text-sm">Collect <strong>{taka(b.totalPrice)}</strong> in cash{b.guest?.phone ? ` · ${b.guest.phone}` : ''}</div>
                </div>
                <CompleteStay booking={b} onDone={bookings.reload} />
              </Card>
            ))}
          </section>

          {/* History */}
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Booking history</h2>
            {completed.length === 0 ? <p className="text-muted">Completed stays appear here.</p> : (
              <Card className="relative overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[15px]">
                  <thead className="border-b border-line text-sm text-muted">
                    <tr><th className="p-4 font-semibold">Guest</th><th className="p-4 font-semibold">Room</th><th className="p-4 font-semibold">Dates</th><th className="p-4 font-semibold">Nights</th><th className="p-4 text-right font-semibold">Cash</th><th className="p-4 font-semibold"><span className="sr-only">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {completed.map((b) => (
                      <Fragment key={b._id}>
                        <tr className="border-b border-line last:border-0">
                          <td className="p-4 font-semibold">{b.guest?.name}</td>
                          <td className="p-4">{b.listing?.title}</td>
                          <td className="p-4 text-muted">{fmtRange(b.checkIn, b.checkOut)}</td>
                          <td className="p-4">{b.nights}</td>
                          <td className="p-4 text-right">{taka(b.totalPrice)}</td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1">
                              {b.reviewedByMe
                                ? <Chip tone="good">Reviewed</Chip>
                                : <Button variant="outline" onClick={() => setReviewing(reviewing === b._id ? null : b._id)}>Review guest</Button>}
                              <Button variant="ghost" onClick={() => setReporting(b)} aria-label={`Report ${b.guest?.name}`}><Flag size={18} aria-hidden="true" /></Button>
                            </div>
                          </td>
                        </tr>
                        {reviewing === b._id && (
                          <tr className="border-b border-line">
                            <td colSpan={6} className="bg-ground p-5">
                              <ReviewForm bookingId={b._id} onCancel={() => setReviewing(null)} onDone={() => { setReviewing(null); bookings.reload(); }} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </section>
        </div>

        {reporting && <ReportDialog booking={reporting._id} against={`${reporting.guest?.name} (guest)`} onClose={() => setReporting(null)} />}

        <aside className="flex w-full flex-col gap-6 lg:w-[380px] lg:flex-none">
          {rooms.data?.length > 0 && <HostCalendar rooms={rooms.data} bookings={all} onChange={rooms.reload} />}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">My rooms</h2>
              {user?.status === 'approved' && <Link to="/host/add-room" className="font-semibold">+ Add room</Link>}
            </div>
            <ErrorBox message={rooms.error} />
            {rooms.data?.length === 0 && (
              <Empty title="No rooms yet">
                {user?.status === 'approved' ? <Link to="/host/add-room">Add your first room</Link> : 'You can add rooms once your ID is approved.'}
              </Empty>
            )}
            {rooms.data?.map((r) => (
              <Card key={r._id} as={Link} to={`/listing/${r._id}`} className="flex gap-3 p-3 text-ink no-underline hover:text-ink hover:shadow-lg">
                <div className="h-20 w-24 flex-none overflow-hidden rounded-xl"><Photo src={r.photos?.[0]} alt={r.title} /></div>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="truncate font-bold">{r.title}</div>
                  <div className="text-sm text-muted">Sleeps {r.capacity} · {taka(r.pricePerNight)} / night</div>
                  <Chip tone={roomTone[r.status]} className="self-start">{roomText[r.status]}</Chip>
                </div>
              </Card>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
