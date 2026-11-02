import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios.js';
import Card from './Card.jsx';
import Button from './Button.jsx';
import { ErrorBox } from './State.jsx';
import { errorMessage } from '../lib/listing.js';
import { fmtRange } from '../lib/booking.js';

// Traveller cancels a request or an accepted booking, with an optional reason for the host.
export default function CancelDialog({ booking, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const accepted = booking.status === 'accepted';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/bookings/${booking._id}/cancel`, { reason });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onClick={onClose}>
      <Card as="form" onSubmit={submit} className="flex w-full max-w-lg flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 id="cancel-title" className="text-xl font-bold">Cancel this {accepted ? 'booking' : 'request'}?</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand"><X size={20} /></button>
        </div>
        <p className="text-muted">
          {booking.listing?.title} · {fmtRange(booking.checkIn, booking.checkOut)}
        </p>
        <p>
          {accepted
            ? <>The host is keeping these dates for you. If you cancel, they become free for other travellers and your booking code <strong>{booking.code}</strong> stops working. This can&apos;t be undone.</>
            : 'The host has not accepted yet, so cancelling now costs them nothing.'}
        </p>
        <div>
          <label className="label" htmlFor="cancel-reason">Reason for the host <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="cancel-reason" rows={3} maxLength={300} className="input py-3" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Our trip dates changed" />
        </div>
        <ErrorBox message={error} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Cancelling…' : `Yes, cancel ${accepted ? 'booking' : 'request'}`}</Button>
          <Button variant="ghost" onClick={onClose}>Keep it</Button>
        </div>
      </Card>
    </div>
  );
}
