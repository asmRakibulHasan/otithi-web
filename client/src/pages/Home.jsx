import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ClipboardCheck, MapPin, Banknote, Search } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Photo from '../components/Photo.jsx';
import { CHECKLIST, taka, plural } from '../lib/listing.js';

const promises = [
  { icon: ShieldCheck, t: 'Verified on both sides', d: 'Hosts and guests checked by admin' },
  { icon: ClipboardCheck, t: 'Honest room checklist', d: 'Toilet, power, water — shown upfront' },
  { icon: MapPin, t: 'Landmark directions', d: 'From the bazar to the door' },
  { icon: Banknote, t: 'Cash to host, 0% commission', d: 'Families keep the full amount' },
];

// An example of what a guest sees: the same six questions on every listing
const exampleChecklist = { toilet: 'outside', electricity: 'loadshedding', water: 'tubewell', network: 'weak', bedding: 'provided', road: 'short_walk' };

const steps = [
  { t: 'Search a village', d: 'Pick a district and village, filter by dates, guests, price and room conditions.' },
  { t: 'Send a request', d: 'Verified travellers request dates. The host checks your reviews and accepts.' },
  { t: 'Get your code', d: 'Accepted? You receive a short booking code and landmark directions.' },
  { t: 'Pay cash & review', d: 'Show the code, pay the host in cash, then both of you leave a review.' },
];

// 01 · Home
export default function Home() {
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
                <p className="text-sm text-muted">{plural(v.stats.households, 'household')} · {plural(v.stats.rooms, 'room')} · up to {v.stats.capacity} guests</p>
                <p className="pt-1"><strong className="text-paddy">from {taka(v.stats.minPrice)}</strong><span className="text-sm text-muted"> / night</span></p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="safety" className="scroll-mt-6 bg-white py-16">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">No surprises on arrival</span>
            <h2 className="text-4xl font-extrabold">The truth about the room, before you travel.</h2>
            <p className="text-lg text-muted">
              Every host answers the same six questions before their room is published. If the toilet is outside or power
              comes from solar, you&apos;ll know — and after your stay you can tell others whether it was accurate.
            </p>
            <p className="text-muted">
              Hosts and travellers both upload an ID that only the admin sees. Hosts can read a guest&apos;s past reviews before accepting,
              and every listing says who lives in the house and whether it suits a solo woman or a family with children.
            </p>
            <div className="flex flex-wrap gap-2"><Chip tone="good">Good / available</Chip><Chip tone="warn">Be prepared</Chip><Chip tone="none">Note</Chip></div>
          </div>
          <Card stitch className="flex flex-col gap-3 p-6 md:p-8">
            <span className="text-sm font-semibold text-muted">Example listing · answered by the host</span>
            {CHECKLIST.map(({ key, label, icon: Icon, options }) => {
              const a = options.find((o) => o.value === exampleChecklist[key]);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-paddy-soft text-paddy"><Icon size={20} aria-hidden="true" /></span>
                  <span className="flex-1">{label}</span>
                  <Chip tone={a.tone}>{a.label}</Chip>
                </div>
              );
            })}
          </Card>
        </div>
      </section>

      <section id="how-it-works" className="wrap scroll-mt-6 py-16">
        <span className="eyebrow">How it works</span>
        <h2 className="mb-8 text-4xl font-extrabold">Four steps to a village stay</h2>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, i) => (
            <li key={st.t}>
              <Card className="flex h-full flex-col gap-2 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mustard font-display text-lg font-extrabold text-ink">{i + 1}</span>
                <h3 className="text-xl font-bold">{st.t}</h3>
                <p className="text-muted">{st.d}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap grid gap-5 pb-20 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4 rounded-card bg-paddy p-8 text-white shadow-card">
          <span className="text-[13px] font-bold uppercase tracking-[.08em] text-mustard">Travelling as a group?</span>
          <h2 className="text-3xl font-extrabold">Six friends, three houses, one village.</h2>
          <p className="text-[#CFE1D6]">No single village house fits a big group — but neighbours together can. Open a village, tick nearby households, and send a request to each.</p>
          <Button variant="accent" to="/browse">Plan a group stay</Button>
        </div>
        <Card stitch className="flex flex-col items-start gap-4 p-8">
          <span className="eyebrow">For village families</span>
          <h2 className="text-3xl font-extrabold">Have a spare room? Earn from it.</h2>
          <p className="text-muted">List your guest room for free. You choose who stays, guests pay you directly in cash, and Otithi takes no commission.</p>
          <Button to="/register?role=host">Become a host</Button>
        </Card>
      </section>
    </>
  );
}
