import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../api/axios.js';
import useApi from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Button from '../components/Button.jsx';
import Photo from '../components/Photo.jsx';
import { Loading, ErrorBox } from '../components/State.jsx';
import { taka, errorMessage } from '../lib/listing.js';
import { todayInput, nightsBetween } from '../lib/booking.js';

// 05 · Booking — State 1: request to stay
export default function Booking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: l, loading, error } = useApi(`/listings/${id}`);

  const [form, setForm] = useState({
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: params.get('guests') || '1',
    message: '',
    agree: false,
  });
  const [sendError, setSendError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error) return <div className="wrap py-10"><ErrorBox message={error} /></div>;

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const total = nights * l.pricePerNight;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSendError('');
    if (nights < 1) return setSendError('Choose check-in and check-out dates');
    if (!form.agree) return setSendError('Please confirm you have read the checklist and house rules');
    setBusy(true);
    try {
      const { data } = await api.post('/bookings', {
        listing: id, checkIn: form.checkIn, checkOut: form.checkOut, guests: Number(form.guests), message: form.message,
      });
      navigate(`/bookings/${data._id}`, { replace: true });
    } catch (err) {
      setSendError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const notVerified = user?.status !== 'approved';

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      <div>
        <Link to={`/listing/${id}`} className="text-sm">← Back to the room</Link>
        <h1 className="mt-1 text-4xl font-extrabold">Request to stay</h1>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <Card as="form" onSubmit={onSubmit} className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 p-6 md:p-8">
          {notVerified && (
            <p className="rounded-xl bg-mustard-soft px-4 py-3 text-sm font-semibold text-[#4A3A10]" role="status">
              Your ID is waiting for admin approval. You can send requests once you are verified.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label" htmlFor="b-in">Check-in</label>
              <input id="b-in" type="date" required min={todayInput()} className="input" value={form.checkIn} onChange={set('checkIn')} /></div>
            <div><label className="label" htmlFor="b-out">Check-out</label>
              <input id="b-out" type="date" required min={form.checkIn || todayInput()} className="input" value={form.checkOut} onChange={set('checkOut')} /></div>
            <div><label className="label" htmlFor="b-guests">Guests</label>
              <select id="b-guests" className="input" value={form.guests} onChange={set('guests')}>
                {Array.from({ length: l.capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
              </select></div>
          </div>
          <div>
            <label className="label" htmlFor="b-msg">Message to host</label>
            <textarea id="b-msg" rows={4} maxLength={1000} className="input py-3" value={form.message} onChange={set('message')}
              placeholder="Assalamu alaikum! Say who is coming and roughly when you will arrive." />
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 flex-none accent-paddy" checked={form.agree} onChange={set('agree')} />
            <span>I have read the <Link to={`/listing/${id}`}>condition checklist and house rules</Link>, and I understand payment is in cash to the host.</span>
          </label>
          <ErrorBox message={sendError} />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <div><div className="text-sm text-muted">Total to pay host in cash</div><div className="font-display text-3xl font-extrabold text-paddy">{taka(total)}</div></div>
            <Button type="submit" size="lg" disabled={busy || notVerified}>{busy ? 'Sending…' : 'Send request'}</Button>
          </div>
        </Card>

        <aside className="w-full lg:w-[340px] lg:flex-none">
          <Card className="flex flex-col overflow-hidden">
            <div className="h-44"><Photo src={l.photos?.[0]} alt={l.title} /></div>
            <div className="flex flex-col gap-2 p-5">
              <h2 className="text-lg font-bold leading-snug">{l.title}</h2>
              <div className="text-sm text-muted">{l.host?.name}&apos;s house · {l.village?.name}, {l.village?.district?.name}</div>
              <Chip tone="good" className="self-start"><ShieldCheck size={14} aria-hidden="true" />Verified host</Chip>
              <dl className="mt-2 flex flex-col gap-1.5 border-t border-line pt-3 text-[15px]">
                <div className="flex justify-between"><dt>{taka(l.pricePerNight)} × {nights} night{nights === 1 ? '' : 's'}</dt><dd>{taka(total)}</dd></div>
                <div className="flex justify-between"><dt>Platform fee</dt><dd>৳0</dd></div>
              </dl>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
