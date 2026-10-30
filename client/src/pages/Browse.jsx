import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home as HomeIcon, BedDouble, Users, SlidersHorizontal, Search } from 'lucide-react';
import useApi from '../hooks/useApi.js';
import Card from '../components/Card.jsx';
import Chip from '../components/Chip.jsx';
import Button from '../components/Button.jsx';
import Photo from '../components/Photo.jsx';
import RoomCard from '../components/RoomCard.jsx';
import Stars from '../components/Stars.jsx';
import { Loading, ErrorBox, Empty } from '../components/State.jsx';
import { CHECKLIST, SAFETY, taka } from '../lib/listing.js';

const FILTER_KEYS = ['district', 'village', 'checkIn', 'checkOut', 'guests', 'minPrice', 'maxPrice',
  ...CHECKLIST.map((c) => c.key), ...SAFETY.map((s) => s.key)];

// Group a flat list of rooms into village cards (02 · Browse "By village")
function groupByVillage(listings, guests) {
  const map = new Map();
  for (const l of listings) {
    const id = l.village?._id;
    if (!id) continue;
    if (!map.has(id)) map.set(id, { village: l.village, rooms: [], hosts: new Set() });
    const g = map.get(id);
    g.rooms.push(l);
    g.hosts.add(l.host?._id);
  }
  return [...map.values()].map((g) => {
    const capacity = g.rooms.reduce((s, r) => s + r.capacity, 0);
    const rated = g.rooms.filter((r) => r.rating?.count);
    const count = rated.reduce((s, r) => s + r.rating.count, 0);
    const rating = count ? { count, avg: rated.reduce((s, r) => s + r.rating.avg * r.rating.count, 0) / count } : null;
    const attached = g.rooms.filter((r) => r.checklist.toilet === 'attached').length;
    const chips = [];
    if (attached) chips.push({ tone: 'good', text: `Attached toilet in ${attached} home${attached > 1 ? 's' : ''}` });
    if (g.rooms.some((r) => r.checklist.electricity !== 'steady')) chips.push({ tone: 'warn', text: 'Power cuts possible' });
    if (g.rooms.some((r) => r.safety?.soloFemaleOk)) chips.push({ tone: 'good', text: 'Solo female friendly' });
    if (g.rooms.some((r) => r.checklist.network === 'none')) chips.push({ tone: 'none', text: 'No network in some homes' });
    return {
      ...g,
      households: g.hosts.size,
      roomCount: g.rooms.reduce((s, r) => s + (r.rooms || 1), 0),
      capacity,
      rating,
      minPrice: Math.min(...g.rooms.map((r) => r.pricePerNight)),
      chips: chips.slice(0, 3),
      fit: guests ? (capacity >= guests ? `Fits your group of ${guests}` : `Only ${capacity} beds for your group of ${guests}`) : null,
    };
  });
}

function CheckGroup({ legend, name, options, params, toggle }) {
  const selected = (params.get(name) || '').split(',').filter(Boolean);
  return (
    <fieldset className="flex flex-col gap-1 border-t border-[#EDE7DB] py-4">
      <legend className="mb-2 pt-4 text-[15px] font-bold">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="flex min-h-8 cursor-pointer items-center gap-2.5 text-[15px]">
          <input type="checkbox" className="h-[18px] w-[18px] accent-paddy" checked={selected.includes(o.value)}
            onChange={() => toggle(name, o.value)} />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const view = params.get('view') === 'room' ? 'room' : 'village';
  const guests = Number(params.get('guests')) || 0;

  const query = useMemo(() => {
    const q = {};
    FILTER_KEYS.forEach((k) => params.get(k) && (q[k] = params.get(k)));
    return q;
  }, [params]);

  const { data: districts } = useApi('/districts');
  const { data: listings, loading, error } = useApi('/listings', query);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // Toggle one value in a comma-separated list param (checkbox groups)
  const toggle = (name, value) => {
    const set = new Set((params.get(name) || '').split(',').filter(Boolean));
    set.has(value) ? set.delete(value) : set.add(value);
    update({ [name]: [...set].join(',') });
  };

  const clearAll = () => setParams(view === 'room' ? { view: 'room' } : {}, { replace: true });

  const villages = useMemo(() => groupByVillage(listings || [], guests), [listings, guests]);
  const districtName = districts?.find((d) => d._id === params.get('district'))?.name;

  const onSearch = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    update({ district: f.get('district'), checkIn: f.get('checkIn'), checkOut: f.get('checkOut'), guests: f.get('guests'), village: '' });
  };

  const activeCount = FILTER_KEYS.filter((k) => !['district', 'village', 'checkIn', 'checkOut', 'guests'].includes(k) && params.get(k)).length;

  return (
    <div className="wrap flex flex-col gap-6 pb-16 pt-8">
      {/* Search bar */}
      <Card as="form" stitch onSubmit={onSearch} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.8fr_auto] lg:items-end">
        <div>
          <label className="label" htmlFor="s-district">District</label>
          <select id="s-district" name="district" className="input" defaultValue={params.get('district') || ''} key={`d-${params.get('district')}`}>
            <option value="">All districts</option>
            {districts?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s-in">Check-in</label>
          <input id="s-in" name="checkIn" type="date" className="input" defaultValue={params.get('checkIn') || ''} />
        </div>
        <div>
          <label className="label" htmlFor="s-out">Check-out</label>
          <input id="s-out" name="checkOut" type="date" className="input" defaultValue={params.get('checkOut') || ''} />
        </div>
        <div>
          <label className="label" htmlFor="s-guests">Guests</label>
          <input id="s-guests" name="guests" type="number" min="1" max="30" className="input" defaultValue={params.get('guests') || ''} placeholder="Any" />
        </div>
        <Button type="submit" className="min-h-12"><Search size={18} aria-hidden="true" />Search</Button>
      </Card>

      <div className="flex flex-wrap items-start gap-8">
        {/* Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} w-full lg:block lg:w-[290px] lg:flex-none`}>
          <Card className="px-5 pb-2 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Filters</h2>
              <button type="button" onClick={clearAll} className="text-sm font-semibold text-paddy hover:underline">Clear all</button>
            </div>

            <fieldset className="mt-3 border-t border-[#EDE7DB] py-4">
              <legend className="mb-2 pt-4 text-[15px] font-bold">Price per night (৳)</legend>
              <div className="flex gap-2.5">
                <label className="flex-1"><span className="label">Min</span>
                  <input type="number" min="0" className="input" defaultValue={params.get('minPrice') || ''} key={`min-${params.get('minPrice')}`}
                    onBlur={(e) => update({ minPrice: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} />
                </label>
                <label className="flex-1"><span className="label">Max</span>
                  <input type="number" min="0" className="input" defaultValue={params.get('maxPrice') || ''} key={`max-${params.get('maxPrice')}`}
                    onBlur={(e) => update({ maxPrice: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} />
                </label>
              </div>
            </fieldset>

            {CHECKLIST.map((c) => (
              <CheckGroup key={c.key} legend={c.label} name={c.key} options={c.options} params={params} toggle={toggle} />
            ))}

            <fieldset className="flex flex-col gap-1 border-t border-[#EDE7DB] py-4">
              <legend className="mb-2 pt-4 text-[15px] font-bold">Household &amp; safety</legend>
              {SAFETY.map((s) => (
                <label key={s.key} className="flex min-h-8 cursor-pointer items-center gap-2.5 text-[15px]">
                  <input type="checkbox" className="h-[18px] w-[18px] accent-paddy" checked={params.get(s.key) === 'true'}
                    onChange={(e) => update({ [s.key]: e.target.checked ? 'true' : '' })} />
                  {s.label}
                </label>
              ))}
            </fieldset>
          </Card>
        </aside>

        {/* Results */}
        <section className="flex min-w-0 flex-1 basis-[560px] flex-col gap-5" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm text-muted"><Link to="/">Home</Link> › {districtName || 'All districts'}</div>
              <h1 className="text-3xl font-extrabold md:text-4xl">
                {loading ? 'Searching…' : `${villages.length} village${villages.length === 1 ? '' : 's'} · ${listings?.length || 0} rooms${districtName ? ` in ${districtName}` : ''}`}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
                <SlidersHorizontal size={18} aria-hidden="true" />Filters{activeCount ? ` (${activeCount})` : ''}
              </Button>
              <div className="flex rounded-xl bg-[#EEE8DC] p-1" role="group" aria-label="View">
                {[['village', 'By village'], ['room', 'By room']].map(([v, label]) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => update({ view: v === 'room' ? 'room' : '' })}
                    className={`min-h-[38px] rounded-[9px] px-4 font-semibold ${view === v ? 'bg-white shadow-sm' : 'hover:bg-sand'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ErrorBox message={error} />
          {loading && <Loading text="Finding stays…" />}

          {!loading && !error && listings?.length === 0 && (
            <Empty title="No rooms match these filters">
              <button type="button" onClick={clearAll} className="font-semibold text-paddy hover:underline">Clear filters</button>
            </Empty>
          )}

          {!loading && view === 'village' && villages.map((g) => (
            <Card as={Link} key={g.village._id} to={`/village/${g.village._id}`}
              className="flex flex-wrap overflow-hidden text-ink no-underline hover:text-ink hover:shadow-lg">
              <div className="min-h-[200px] flex-[1_1_240px]"><Photo src={g.village.photo} label={g.village.area} /></div>
              <div className="flex flex-[2_1_320px] flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold">{g.village.name}</h3>
                    <div className="text-sm text-muted">{g.village.area}{g.village.district?.name ? `, ${g.village.district.name}` : ''} · Nearest bazar: {g.village.nearestBazar}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] text-muted">from</div>
                    <div className="font-display text-2xl font-extrabold text-paddy">{taka(g.minPrice)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-5 text-[15px]">
                  <span className="flex items-center gap-1.5"><HomeIcon size={18} aria-hidden="true" /><strong>{g.households}</strong> household{g.households > 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1.5"><BedDouble size={18} aria-hidden="true" /><strong>{g.roomCount}</strong> rooms</span>
                  <span className="flex items-center gap-1.5"><Users size={18} aria-hidden="true" />up to <strong>{g.capacity}</strong> guests</span>
                  <Stars rating={g.rating} />
                </div>
                <div className="flex flex-wrap gap-2">{g.chips.map((c) => <Chip key={c.text} tone={c.tone}>{c.text}</Chip>)}</div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-sm text-muted">{g.fit}</span>
                  <span className="inline-flex min-h-10 items-center rounded-xl border-[1.5px] border-paddy px-4 font-semibold text-paddy">Open village →</span>
                </div>
              </div>
            </Card>
          ))}

          {!loading && view === 'room' && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings?.map((l) => <RoomCard key={l._id} listing={l} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
