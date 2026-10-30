import { useEffect, useState } from 'react';
import { ShieldCheck, ClipboardCheck, MapPin, Banknote } from 'lucide-react';
import api from '../api/axios.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';

const promises = [
  { icon: ShieldCheck, t: 'Verified on both sides', d: 'Hosts and guests checked by admin' },
  { icon: ClipboardCheck, t: 'Honest room checklist', d: 'Toilet, power, water — shown upfront' },
  { icon: MapPin, t: 'Landmark directions', d: 'From the bazar to the door' },
  { icon: Banknote, t: 'Cash to host, 0% commission', d: 'Families keep the full amount' },
];

// Phase 1: hero + a small system status card to confirm the API and DB are wired up.
export default function Home() {
  const [health, setHealth] = useState(null);

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
        <div className="flex flex-wrap gap-3">
          <Button size="lg" to="/browse">Explore villages</Button>
          <Button size="lg" variant="accent" to="/register?role=host">Become a host</Button>
        </div>
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
