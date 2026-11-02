import { ArrowRight } from 'lucide-react';
import useApi from '../../hooks/useApi.js';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import { Loading, ErrorBox } from '../../components/State.jsx';
import { CHECKLIST, SAFETY, answer, taka } from '../../lib/listing.js';

const TEXT_LABELS = { title: 'Title', directions: 'Directions', nearestLandmark: 'Nearest landmark' };
const clip = (t = '') => (t.length > 90 ? `${t.slice(0, 90)}…` : t || '—');

// One changed field as "label: before → after", compared with the version the admin last approved
function describe(field, before = {}, room) {
  if (field.startsWith('checklist.')) {
    const key = field.slice(10);
    return {
      label: CHECKLIST.find((c) => c.key === key)?.label || key,
      from: answer(key, before.checklist?.[key]), to: answer(key, room.checklist?.[key]),
    };
  }
  if (field.startsWith('safety.')) {
    const key = field.slice(7);
    const yesNo = (v) => (v ? { label: 'Yes', tone: 'good' } : { label: 'No', tone: 'none' });
    return { label: SAFETY.find((s) => s.key === key)?.label || key, from: yesNo(before.safety?.[key]), to: yesNo(room.safety?.[key]) };
  }
  if (field === 'photos') {
    const old = before.photos || [];
    const added = room.photos.filter((p) => !old.includes(p)).length;
    const removed = old.filter((p) => !room.photos.includes(p)).length;
    const parts = [added && `${added} new`, removed && `${removed} removed`].filter(Boolean);
    return { label: 'Photos', text: parts.length ? parts.join(', ') : 'Order or cover changed' };
  }
  return { label: TEXT_LABELS[field] || field, fromText: clip(before[field]), toText: clip(room[field]) };
}

// Live rooms the host edited: the changes are already visible, the admin double-checks them.
export default function UpdatedRoomsSection({ act, onChange }) {
  const rooms = useApi('/admin/listings', { needsReview: 'true' });
  const decide = (l, status) => act(`/admin/listings/${l._id}/status`, status, [rooms, { reload: onChange }]);

  if (rooms.loading) return <Loading />;
  if (!rooms.data?.length && !rooms.error) return null; // nothing to show: keep the page short

  return (
    <section id="updated-rooms" className="flex scroll-mt-6 flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold">Updated rooms</h2>
        <p className="text-muted">Hosts changed these live rooms. The changes are already visible; check they still match reality.</p>
      </div>
      <ErrorBox message={rooms.error} />
      <div className="grid gap-4 lg:grid-cols-2">
        {rooms.data?.map((l) => (
          <Card key={l._id} className="flex flex-col gap-3 p-5">
            <div>
              <h3 className="text-lg font-bold">{l.title}</h3>
              <div className="text-sm text-muted">
                {l.host?.name} · {l.village?.name}, {l.village?.district?.name} · {taka(l.pricePerNight)} / night · edited {new Date(l.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <ul className="flex flex-col gap-2 border-t border-line pt-3 text-[15px]">
              {l.changedFields.map((f) => {
                const c = describe(f, l.lastApproved, l);
                return (
                  <li key={f} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{c.label}:</span>
                    {c.text && <span>{c.text}</span>}
                    {c.from && <><Chip tone={c.from.tone}>{c.from.label}</Chip><ArrowRight size={16} aria-label="changed to" /><Chip tone={c.to.tone}>{c.to.label}</Chip></>}
                    {c.fromText !== undefined && <><span className="text-muted line-through">{c.fromText}</span><ArrowRight size={16} aria-label="changed to" /><span>{c.toText}</span></>}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" to={`/listing/${l._id}`}>View room</Button>
              <Button onClick={() => decide(l, 'approved')}>Looks good</Button>
              <Button variant="danger" onClick={() => decide(l, 'rejected')}>Unpublish</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
