import { DoorClosed, Zap, Droplet, Signal, BedDouble, Route } from 'lucide-react';

// The six fixed checklist questions. Values match server/models/Listing.js.
// tone: good = available, warn = be prepared, none = not available / neutral
export const CHECKLIST = [
  {
    key: 'toilet', label: 'Toilet', question: 'Where is the toilet?', icon: DoorClosed,
    options: [
      { value: 'attached', label: 'Attached', tone: 'good' },
      { value: 'outside', label: 'Outside', tone: 'warn' },
      { value: 'shared', label: 'Shared', tone: 'warn' },
    ],
  },
  {
    key: 'electricity', label: 'Electricity', question: 'How is the electricity?', icon: Zap,
    options: [
      { value: 'steady', label: 'Steady', tone: 'good' },
      { value: 'loadshedding', label: 'Load-shedding common', tone: 'warn' },
      { value: 'solar', label: 'Solar only', tone: 'warn' },
    ],
  },
  {
    key: 'water', label: 'Water', question: 'Where does water come from?', icon: Droplet,
    options: [
      { value: 'tap', label: 'Tap', tone: 'good' },
      { value: 'tubewell', label: 'Tubewell', tone: 'good' },
      { value: 'pond', label: 'Pond', tone: 'warn' },
    ],
  },
  {
    key: 'network', label: 'Mobile network', question: 'How is the mobile network?', icon: Signal,
    options: [
      { value: 'good', label: 'Good', tone: 'good' },
      { value: 'weak', label: 'Weak', tone: 'warn' },
      { value: 'none', label: 'None', tone: 'none' },
    ],
  },
  {
    key: 'bedding', label: 'Bedding', question: 'Is bedding provided?', icon: BedDouble,
    options: [
      { value: 'provided', label: 'Provided', tone: 'good' },
      { value: 'bring_own', label: 'Bring your own', tone: 'warn' },
    ],
  },
  {
    key: 'road', label: 'Road access', question: 'How do guests reach the house?', icon: Route,
    options: [
      { value: 'vehicle', label: 'Vehicle reaches house', tone: 'good' },
      { value: 'short_walk', label: 'Short walk', tone: 'none' },
      { value: 'long_walk', label: 'Long walk', tone: 'warn' },
    ],
  },
];

export const toneWord = { good: 'Good', warn: 'Be prepared', none: 'Note' };

// Look up the label + tone for one answer, e.g. answer('toilet', 'outside')
export function answer(key, value) {
  const q = CHECKLIST.find((c) => c.key === key);
  return q?.options.find((o) => o.value === value) || { label: value || '—', tone: 'none' };
}

export const SAFETY = [
  { key: 'familyOnSite', label: 'Family lives in the same house' },
  { key: 'femaleMembersPresent', label: 'Female family members present' },
  { key: 'separateEntrance', label: 'Separate entrance for guests' },
  { key: 'soloFemaleOk', label: 'Suitable for solo female traveller' },
  { key: 'childrenOk', label: 'Good for families with children' },
];

export const taka = (n) => `৳${Number(n || 0).toLocaleString('en-IN')}`;

export const errorMessage = (err, fallback = 'Something went wrong. Is the server running?') =>
  err?.response?.data?.message || fallback;
