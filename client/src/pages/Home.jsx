import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ClipboardCheck, MapPin, Banknote, Search } from 'lucide-react';
import api from '../api/axios.js';
import useApi from '../hooks/useApi.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Photo from '../components/Photo.jsx';
import { taka } from '../lib/listing.js';

const promises = [
  { icon: ShieldCheck, t: 'Verified on both sides', d: 'Hosts and guests checked by admin' },
  { icon: ClipboardCheck, t: 'Honest room checklist', d: 'Toilet, power, water — shown upfront' },
  { icon: MapPin, t: 'Landmark directions', d: 'From the bazar to the door' },
  { icon: Banknote, t: 'Cash to host, 0% commission', d: 'Families keep the full amount' },
];

// Phase 1: hero + a small system status card to confirm the API and DB are wired up.
export default function Home() {
  const [health, setHealth] = useState(null);
  const navigate = useNavigate();
  const { data: districts } = useApi('/districts');
  const { data: villages } = useApi('/villages');
  const featured = (villages || []).filter((v) => v.stats.listings > 0)
    .sort((a, b) => b.stats.capacity - a.stats.capacity).slice(0, 4);

  const onSearch = (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(e.target)) if (v) q.set(k, v);
    navigate(`/browse?${q}`);
  };

  useEffect(() => {
    api.get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setHealth({ status: 'down', db: 'unknown' }));
  }, []);

  return (
    <>
      <section className="wrap flex flex-col gap-6 py-16 md:py-24">
        <span className="eyebrow">Domestic travel · Bangladesh only</span>
        <h1 className="max-w-3xl text-5xl font-extrabold md:text-6xl">Stay with a family where no hotel reaches.</h1>
        <p className="max-w-2xl text-lg text-muted">
          Find verified homestays in villages, hills and haors. See the real room conditions before you go,
          follow landmark directions, and pay the host in cash.
        </p>
        <Card as="form" stitch onSubmit={onSearch} className="grid max-w-4xl gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.8fr_auto] lg:items-end">
          <div>
            <label className="label" htmlFor="h-district">District</label>
            <select id="h-district" name="district" className="input">
              <option value="">All districts</option>
              {districts?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="h-in">Check-in</label><input id="h-in" name="checkIn" type="date" className="input" /></div>
          <div><label className="label" htmlFor="h-out">Check-out</label><input id="h-out" name="checkOut" type="date" className="input" /></div>
          <div><label className="label" htmlFor="h-guests">Guests</label><input id="h-guests" name="guests" type="number" min="1" className="input" placeholder="Any" /></div>
          <Button type="submit" className="min-h-12"><Search size={18} aria-hidden="true" />Search stays</Button>
        </Card>
      </section>

      <section className="wrap grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {promises.map(({ icon: Icon, t, d }) => (
          <Card key={t} className="flex gap-3 p-5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-paddy-soft text-paddy">
              <Icon size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold">{t}</span>
              <span className="text-sm text-muted">{d}</span>
            </span>
          </Card>
        ))}
      </section>

      <section className="wrap flex flex-col gap-5 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><span className="eyebrow">Browse by village</span><h2 className="text-3xl font-extrabold">Villages waiting for guests</h2></div>
          <Button variant="outline" to="/browse">See all villages</Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((v) => (
            <Card key={v._id} as={Link} to={`/village/${v._id}`} className="flex flex-col overflow-hidden text-ink no-underline hover:text-ink hover:shadow-lg">
              <div className="h-40"><Photo src={v.photo} label={v.district?.name} /></div>
              <div className="flex flex-col gap-1 p-5">
                <h3 className="text-xl font-bold">{v.name}</h3>
                <p className="text-sm text-muted">{v.stats.households} households · {v.stats.rooms} rooms · up to {v.stats.capacity} guests</p>
                <p className="pt-1"><strong className="text-paddy">from {taka(v.stats.minPrice)}</strong><span className="text-sm text-muted"> / night</span></p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="wrap pb-20">
        <Card stitch className="flex flex-wrap items-center gap-4 p-6">
          <span className="font-bold">System status</span>
          {!health && <Chip tone="none">Checking…</Chip>}
          {health && (
            <>
              <Chip tone={health.status === 'ok' ? 'good' : 'bad'}>API: {health.status}</Chip>
              <Chip tone={health.db === 'connected' ? 'good' : 'bad'}>Database: {health.db}</Chip>
            </>
          )}
        </Card>
      </section>
    </>
  );
}
