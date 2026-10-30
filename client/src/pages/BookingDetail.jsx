import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, Lock, MapPin, Phone, Landmark } from 'lucide-react';
import api from '../api/axios.js';
import useApi from '../hooks/useApi.js';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Button from '../components/Button.jsx';
import { Loading, ErrorBox } from '../components/State.jsx';
import { taka, errorMessage } from '../lib/listing.js';
import { fmtDay, STATUS, isPast } from '../lib/booking.js';

const when = (d) => d && new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// 05 · Booking — State 2: request sent / host accepted (booking code + directions)
export default function BookingDetail() {
  const { id } = useParams();
  const { data: b, loading, error, reload } = useApi(`/bookings/${id}`);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');

  if (loading) return <Loading />;
  if (error) return <div className="wrap py-10"><ErrorBox message={error} /></div>;

  const l = b.listing;
  const s = STATUS[b.status];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(b.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setActionError('');
    try {
      await api.put(`/bookings/${b._id}/cancel`);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const steps = [
    { t: 'Request sent', d: when(b.createdAt), done: true },
    { t: 'Accepted by host · code issued', d: when(b.acceptedAt), done: Boolean(b.acceptedAt) },
    { t: 'Stay & pay cash', d: b.completedAt ? when(b.completedAt) : 'Host marks the stay completed', done: b.status === 'completed' },
    { t: 'Review each other', d: 'Was the checklist accurate?', done: false },
  ];

  const canCancel = ['requested', 'accepted'].includes(b.status) && !isPast(b.checkIn);

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/traveller" className="text-sm">← My bookings</Link>
          <h1 className="mt-1 text-4xl font-extrabold">
            {b.status === 'accepted' ? `You're going to ${l.village?.name}!` : b.status === 'requested' ? 'Request sent' : l.title}
          </h1>
          <p className="text-muted">{l.title} · {b.host?.name}&apos;s house, {l.village?.name}</p>
        </div>
        <Chip tone={s.tone}>{s.label}</Chip>
      </div>

      <ErrorBox message={actionError} />

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
          {b.code && b.status !== 'cancelled' ? (
            <Card stitch className="flex flex-col gap-5 p-6 md:p-8">
              <div>
                <div className="eyebrow">Your booking code</div>
                <div className="font-display text-6xl font-extrabold tracking-wider text-paddy">{b.code}</div>
              </div>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div><dt className="text-sm text-muted">Check-in</dt><dd className="font-bold">{fmtDay(b.checkIn)}</dd></div>
                <div><dt className="text-sm text-muted">Check-out</dt><dd className="font-bold">{fmtDay(b.checkOut)}</dd></div>
                <div><dt className="text-sm text-muted">Pay in cash</dt><dd className="font-bold">{taka(b.totalPrice)}</dd></div>
              </dl>
              <p>Show this code to {b.host?.name} on arrival and pay directly. Otithi never asks for online payment.</p>
              <Button variant="outline" onClick={copy} className="self-start">
                {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copied ? 'Copied' : 'Copy code'}
              </Button>
            </Card>
          ) : (
            <Card className="flex flex-col gap-3 p-6">
              <dl className="grid gap-4 sm:grid-cols-4">
                <div><dt className="text-sm text-muted">Check-in</dt><dd className="font-bold">{fmtDay(b.checkIn)}</dd></div>
                <div><dt className="text-sm text-muted">Check-out</dt><dd className="font-bold">{fmtDay(b.checkOut)}</dd></div>
                <div><dt className="text-sm text-muted">Guests</dt><dd className="font-bold">{b.guests}</dd></div>
                <div><dt className="text-sm text-muted">Cash to host</dt><dd className="font-bold">{taka(b.totalPrice)}</dd></div>
              </dl>
              {b.status === 'requested' && <p className="text-muted">The host will reply soon. Your booking code appears here when they accept.</p>}
              {b.status === 'declined' && <p className="text-muted">The host could not accept this request. Try other dates or another house in the village.</p>}
              {b.status === 'cancelled' && <p className="text-muted">You cancelled this booking.</p>}
            </Card>
          )}

          <Card className="flex flex-col gap-3 p-6">
            <h2 className="text-xl font-bold">Directions &amp; host contact</h2>
            {b.unlocked ? (
              <>
                <p className="rounded-xl bg-ground p-4 italic">“{l.directions}”</p>
                <div className="flex flex-wrap gap-5">
                  <span className="flex items-center gap-1.5"><Phone size={18} aria-hidden="true" />Host phone: <a href={`tel:${b.host?.phone}`} className="font-semibold">{b.host?.phone}</a></span>
                  <span className="flex items-center gap-1.5"><MapPin size={18} aria-hidden="true" />Nearest bazar: <strong>{l.nearestBazar}</strong></span>
                </div>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5"><Landmark size={18} aria-hidden="true" />Nearest landmark: <strong>{l.nearestLandmark}</strong></span>
                <p className="flex items-center gap-2 text-sm text-muted"><Lock size={16} aria-hidden="true" />Full directions and the host&apos;s phone number unlock when the host accepts.</p>
              </>
            )}
          </Card>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-[340px] lg:flex-none">
          <Card className="flex flex-col gap-4 p-6">
            <h2 className="text-lg font-bold">Booking status</h2>
            <ol className="flex flex-col gap-4">
              {steps.map((st, i) => (
                <li key={st.t} className="flex gap-3">
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ${st.done ? 'bg-paddy text-white' : 'bg-neutral-soft text-neutral-ink'}`}>
                    {st.done ? <Check size={16} aria-hidden="true" /> : i + 1}
                  </span>
                  <span><span className="block font-semibold">{st.t}</span><span className="text-sm text-muted">{st.d || '—'}</span></span>
                </li>
              ))}
            </ol>
          </Card>
          <Button variant="outline" to={`/listing/${l._id}`}>View the room</Button>
          {canCancel && <Button variant="danger" onClick={cancel}>Cancel {b.status === 'requested' ? 'request' : 'booking'}</Button>}
        </aside>
      </div>
    </div>
  );
}
