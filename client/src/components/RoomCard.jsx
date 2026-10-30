import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import Card from './Card.jsx';
import Chip from './Chip.jsx';
import Photo from './Photo.jsx';
import Stars from './Stars.jsx';
import { answer, taka } from '../lib/listing.js';

export default function RoomCard({ listing }) {
  const v = listing.village;
  return (
    <Card as={Link} to={`/listing/${listing._id}`} className="flex flex-col overflow-hidden text-ink no-underline hover:text-ink hover:shadow-lg">
      <div className="h-44">
        <Photo src={listing.photos?.[0]} alt={listing.title} label={listing.photos?.length ? null : 'No photo yet'} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-2 text-sm text-muted">
          <span>{v?.name}{v?.district?.name ? ` · ${v.district.name}` : ''}</span>
          <Stars rating={listing.rating} showCount={false} />
        </div>
        <h3 className="text-lg font-bold leading-snug">{listing.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {['toilet', 'electricity', 'road'].map((k) => {
            const a = answer(k, listing.checklist?.[k]);
            return <Chip key={k} tone={a.tone}>{a.label}</Chip>;
          })}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-1.5 text-sm text-muted"><Users size={16} aria-hidden="true" />Sleeps {listing.capacity}</span>
          <span><strong className="font-display text-xl text-paddy">{taka(listing.pricePerNight)}</strong><span className="text-sm text-muted"> / night</span></span>
        </div>
      </div>
    </Card>
  );
}
