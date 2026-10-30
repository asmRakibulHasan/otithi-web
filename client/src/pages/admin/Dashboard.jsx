import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios.js';
import useApi from '../../hooks/useApi.js';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import { Loading, ErrorBox, Empty } from '../../components/State.jsx';
import { answer, errorMessage, taka } from '../../lib/listing.js';
import ReportsSection from './ReportsSection.jsx';
import LocationsSection from './LocationsSection.jsx';

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const ago = (d) => {
  const h = Math.round((Date.now() - new Date(d)) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const days = Math.round(h / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

// ID photos are private: fetch with the admin token and show as a blob URL.
function IdViewer({ user, onClose }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let url;
    api.get(`/admin/users/${user._id}/id-document`, { responseType: 'blob' })
      .then((res) => { url = URL.createObjectURL(res.data); setSrc(url); })
      .catch(() => setError('Could not load the ID document'));
    return () => url && URL.revokeObjectURL(url);
  }, [user._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label={`ID document of ${user.name}`} onClick={onClose}>
      <Card className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{user.name} · ID document</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand"><X size={20} /></button>
        </div>
        <ErrorBox message={error} />
        {!src && !error && <Loading />}
        {src && <img src={src} alt={`ID document of ${user.name}`} className="max-h-[70vh] w-full rounded-xl object-contain" />}
      </Card>
    </div>
  );
}

// 10 · Admin panel — Phase 3: stats, verify users, approve listings
export default function AdminDashboard() {
  const [userFilter, setUserFilter] = useState('pending');
  const [viewing, setViewing] = useState(null);
  const [actionError, setActionError] = useState('');

  const stats = useApi('/admin/stats');
  const users = useApi('/admin/users', userFilter === 'all' ? {} : { status: userFilter });
  const listings = useApi('/admin/listings', { status: 'pending' });

  const act = async (url, status, reloaders) => {
    setActionError('');
    try {
      await api.put(url, { status });
      reloaders.forEach((r) => r.reload());
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const s = stats.data;
  const cards = s ? [
    { l: 'Verified hosts', v: s.verifiedHosts, n: `${s.verifiedTravellers} verified travellers` },
    { l: 'Bookings completed', v: s.completedBookings, n: `${s.upcomingBookings} upcoming` },
    { l: 'Districts covered', v: s.districts, n: `${s.villages} villages · ${s.liveListings} live rooms` },
    { l: 'Income to families', v: taka(s.incomeToFamilies), n: 'Paid in cash, 0% commission' },
    { l: 'Pending verification', v: s.pendingUsers, n: 'Hosts and travellers' },
    { l: 'Rooms to review', v: s.pendingListings, n: 'Waiting for approval' },
    { l: 'Open reports', v: s.openReports, n: 'From guests and hosts' },
  ] : [];

  return (
    <div className="wrap flex flex-col gap-8 pb-16 pt-8">
      <div>
        <span className="eyebrow">Admin</span>
        <h1 className="text-4xl font-extrabold">Platform overview</h1>
        <p className="text-muted">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.l} className="flex flex-col gap-1 p-5">
            <span className="text-sm text-muted">{c.l}</span>
            <span className="font-display text-4xl font-extrabold text-paddy">{c.v}</span>
            <span className="text-sm text-muted">{c.n}</span>
          </Card>
        ))}
      </div>

      <ErrorBox message={actionError} />

      {/* Verify users */}
      <section id="verify-users" className="flex scroll-mt-6 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Verify users</h2>
          <div className="flex rounded-xl bg-[#EEE8DC] p-1" role="group" aria-label="Filter users">
            {['pending', 'approved', 'rejected', 'all'].map((f) => (
              <button key={f} type="button" aria-pressed={userFilter === f} onClick={() => setUserFilter(f)}
                className={`min-h-[38px] rounded-[9px] px-4 font-semibold capitalize ${userFilter === f ? 'bg-white shadow-sm' : 'hover:bg-sand'}`}>{f}</button>
            ))}
          </div>
        </div>
        <ErrorBox message={users.error} />
        {users.loading && <Loading />}
        {users.data?.length === 0 && <Empty title="Nobody here">No {userFilter === 'all' ? '' : userFilter} users.</Empty>}
        {users.data?.length > 0 && (
          <Card className="relative overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[15px]">
              <thead className="border-b border-line text-sm text-muted">
                <tr><th className="p-4 font-semibold">User</th><th className="p-4 font-semibold">Role</th><th className="p-4 font-semibold">Village</th>
                  <th className="p-4 font-semibold">ID document</th><th className="p-4 font-semibold">Submitted</th><th className="p-4 font-semibold">Action</th></tr>
              </thead>
              <tbody>
                {users.data.map((u) => (
                  <tr key={u._id} className="border-b border-line last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-mustard-soft text-sm font-bold text-mustard-ink">{initials(u.name)}</span>
                        <span><span className="block font-semibold">{u.name}</span><span className="text-sm text-muted">{u.email} · {u.phone}</span></span>
                      </div>
                    </td>
                    <td className="p-4"><Chip tone={u.role === 'host' ? 'warn' : 'good'} className="capitalize">{u.role}</Chip></td>
                    <td className="p-4">{u.village?.name || '—'}</td>
                    <td className="p-4">
                      {u.hasIdDocument
                        ? <button type="button" onClick={() => setViewing(u)} className="font-semibold text-paddy hover:underline">View ID</button>
                        : <span className="text-muted">None (demo user)</span>}
                    </td>
                    <td className="p-4 text-muted">{ago(u.createdAt)}</td>
                    <td className="p-4">
                      {u.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button onClick={() => act(`/admin/users/${u._id}/status`, 'approved', [users, stats])}>Approve</Button>
                          <Button variant="danger" onClick={() => act(`/admin/users/${u._id}/status`, 'rejected', [users, stats])}>Reject</Button>
                        </div>
                      ) : (
                        <Chip tone={u.status === 'approved' ? 'good' : 'bad'} className="capitalize">{u.status}</Chip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Approve listings */}
      <section id="rooms" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="text-2xl font-bold">Rooms awaiting approval</h2>
        <ErrorBox message={listings.error} />
        {listings.loading && <Loading />}
        {listings.data?.length === 0 && <Empty title="All caught up">No rooms are waiting for review.</Empty>}
        <div className="grid gap-4 lg:grid-cols-2">
          {listings.data?.map((l) => (
            <Card key={l._id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{l.title}</h3>
                  <div className="text-sm text-muted">{l.host?.name} · {l.village?.name}, {l.village?.district?.name} · {taka(l.pricePerNight)} / night</div>
                </div>
                {l.host?.status !== 'approved' && <Chip tone="bad">Host not verified</Chip>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="good">Checklist complete</Chip>
                <Chip tone={l.photos.length ? 'none' : 'warn'}>{l.photos.length} photo{l.photos.length === 1 ? '' : 's'}</Chip>
                {['toilet', 'electricity'].map((k) => { const a = answer(k, l.checklist?.[k]); return <Chip key={k} tone={a.tone}>{a.label}</Chip>; })}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" to={`/listing/${l._id}`}>Review</Button>
                <Button onClick={() => act(`/admin/listings/${l._id}/status`, 'approved', [listings, stats])}>Publish</Button>
                <Button variant="danger" onClick={() => act(`/admin/listings/${l._id}/status`, 'rejected', [listings, stats])}>Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <ReportsSection onChange={stats.reload} />
      <LocationsSection onChange={stats.reload} />

      {viewing && <IdViewer user={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
