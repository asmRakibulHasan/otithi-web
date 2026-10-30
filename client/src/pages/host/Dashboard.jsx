import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/Card.jsx';
import Chip from '../../components/Chip.jsx';
import Button from '../../components/Button.jsx';
import Photo from '../../components/Photo.jsx';
import { Loading, ErrorBox, Empty } from '../../components/State.jsx';
import { taka } from '../../lib/listing.js';

const statusTone = { approved: 'good', pending: 'warn', rejected: 'bad' };
const statusText = { approved: 'Live', pending: 'Waiting for admin', rejected: 'Rejected' };

// 08 · Host dashboard — Phase 3: "My rooms". Requests, calendar and history come in Phase 4.
export default function HostDashboard() {
  const { user } = useAuth();
  const { data: rooms, loading, error } = useApi('/listings/mine');

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Host dashboard</span>
          <h1 className="text-4xl font-extrabold">Assalamu alaikum, {user?.name?.split(' ')[0]}</h1>
        </div>
        {user?.status === 'approved' && <Button to="/host/add-room"><Plus size={18} aria-hidden="true" />Add a room</Button>}
      </div>

      <h2 className="text-2xl font-bold">My rooms</h2>
      <ErrorBox message={error} />
      {loading && <Loading />}
      {rooms?.length === 0 && (
        <Empty title="No rooms yet">
          {user?.status === 'approved' ? <Link to="/host/add-room">Add your first room</Link> : 'You can add rooms once your ID is approved.'}
        </Empty>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rooms?.map((r) => (
          <Card key={r._id} as={Link} to={`/listing/${r._id}`} className="flex flex-col overflow-hidden text-ink no-underline hover:text-ink hover:shadow-lg">
            <div className="h-40"><Photo src={r.photos?.[0]} alt={r.title} /></div>
            <div className="flex flex-col gap-2 p-5">
              <Chip tone={statusTone[r.status]} className="self-start">{statusText[r.status]}</Chip>
              <h3 className="text-lg font-bold leading-snug">{r.title}</h3>
              <div className="text-sm text-muted">{r.village?.name} · sleeps {r.capacity} · {taka(r.pricePerNight)} / night</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
