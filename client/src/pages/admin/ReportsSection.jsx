import { useState } from 'react';
import api from '../../api/axios.js';
import useApi from '../../hooks/useApi.js';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import { Loading, ErrorBox, Empty } from '../../components/State.jsx';
import { errorMessage } from '../../lib/listing.js';
import { fmtRange } from '../../lib/booking.js';

const typeText = { guest_to_host: 'Guest → Host', host_to_guest: 'Host → Guest' };

export default function ReportsSection({ onChange }) {
  const [status, setStatus] = useState('open');
  const reports = useApi('/admin/reports', { status });
  const [error, setError] = useState('');

  const resolve = async (id) => {
    setError('');
    try {
      await api.put(`/admin/reports/${id}/resolve`);
      reports.reload();
      onChange?.();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="flex rounded-xl bg-[#EEE8DC] p-1" role="group" aria-label="Filter reports">
          {['open', 'resolved'].map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
              className={`min-h-[38px] rounded-[9px] px-4 font-semibold capitalize ${status === s ? 'bg-white shadow-sm' : 'hover:bg-sand'}`}>{s}</button>
          ))}
        </div>
      </div>
      <ErrorBox message={reports.error || error} />
      {reports.loading && <Loading />}
      {reports.data?.length === 0 && <Empty title={status === 'open' ? 'No open reports' : 'No resolved reports yet'} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.data?.map((r) => (
          <Card key={r._id} className="flex flex-col gap-2 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="bad">{typeText[r.type]}</Chip>
              <span className="text-sm text-muted">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
            <h3 className="text-lg font-bold">{r.title}</h3>
            <p className="text-[15px]">{r.details}</p>
            <p className="text-sm text-muted">
              From <strong>{r.reporter?.name}</strong> about <strong>{r.against?.name}</strong>
              {r.booking ? ` · Booking ${r.booking.code || ''} (${fmtRange(r.booking.checkIn, r.booking.checkOut)})` : ''}
              {r.listing ? ` · ${r.listing.title}, ${r.listing.village?.name}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {r.listing && <Button variant="outline" to={`/listing/${r.listing._id}`}>View room</Button>}
              {r.status === 'open' ? <Button onClick={() => resolve(r._id)}>Mark resolved</Button> : <Chip tone="good" className="self-center">Resolved</Chip>}
            </div>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted">To act on a report, reject the user in <a href="#verify-users">Verify users</a> or the room in <a href="#rooms">Rooms awaiting approval</a>.</p>
    </section>
  );
}
