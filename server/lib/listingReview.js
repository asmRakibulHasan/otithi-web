import { CHECKLIST, SAFETY_KEYS } from '../models/Listing.js';

// When a live room is edited, changes to these fields are what guests rely on to trust the room,
// so the admin double-checks them. Price, description, house rules etc. apply with no review.
const TEXT_FIELDS = ['title', 'directions', 'nearestLandmark'];

// The trust-related fields of a room, as plain values
export function reviewSnapshot(listing) {
  const o = listing.toObject ? listing.toObject() : listing;
  return {
    ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, o[k] ?? ''])),
    checklist: Object.fromEntries(Object.keys(CHECKLIST).map((k) => [k, o.checklist?.[k] ?? null])),
    safety: Object.fromEntries(SAFETY_KEYS.map((k) => [k, Boolean(o.safety?.[k])])),
    photos: [...(o.photos || [])],
  };
}

// Names of the trust-related fields that differ between a snapshot and the room now,
// e.g. ['title', 'checklist.toilet', 'safety.soloFemaleOk', 'photos']
export function changedSince(before, listing) {
  if (!before) return [];
  const now = reviewSnapshot(listing);
  const changed = TEXT_FIELDS.filter((k) => String(before[k] ?? '').trim() !== String(now[k] ?? '').trim());
  for (const k of Object.keys(CHECKLIST)) if ((before.checklist?.[k] ?? null) !== now.checklist[k]) changed.push(`checklist.${k}`);
  for (const k of SAFETY_KEYS) if (Boolean(before.safety?.[k]) !== now.safety[k]) changed.push(`safety.${k}`);
  if (JSON.stringify(before.photos || []) !== JSON.stringify(now.photos)) changed.push('photos');
  return changed;
}
