import { useState } from 'react';
import { X, Check } from 'lucide-react';
import api from '../api/axios.js';
import Card from './Card.jsx';
import Button from './Button.jsx';
import { ErrorBox } from './State.jsx';
import { errorMessage } from '../lib/listing.js';

// Report a problem about a booking ({ booking }) or a room ({ listing }) to the admin.
export default function ReportDialog({ booking, listing, against, onClose }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return setError('Add a title and describe what happened');
    setBusy(true);
    setError('');
    try {
      await api.post('/reports', { booking, listing, title, details });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={onClose}>
      <Card className="flex w-full max-w-lg flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 id="report-title" className="text-xl font-bold">Report a problem</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand"><X size={20} /></button>
        </div>
        {sent ? (
          <>
            <p className="flex items-center gap-2 font-semibold text-paddy"><Check size={20} aria-hidden="true" />Thank you. The admin will look into it.</p>
            <Button onClick={onClose} className="self-start">Close</Button>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            {against && <p className="text-sm text-muted">About: {against}. Only the admin sees reports.</p>}
            <div><label className="label" htmlFor="rp-title">What went wrong?</label>
              <input id="rp-title" className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Checklist said attached toilet, it was outside" /></div>
            <div><label className="label" htmlFor="rp-details">Details</label>
              <textarea id="rp-details" rows={4} maxLength={2000} className="input py-3" value={details} onChange={(e) => setDetails(e.target.value)} /></div>
            <ErrorBox message={error} />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
