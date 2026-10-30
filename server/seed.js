// Demo data for local development. WARNING: wipes users, districts, villages and listings.
// Run: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import District from './models/District.js';
import Village from './models/Village.js';
import Listing from './models/Listing.js';

const districts = {
  Sylhet: [
    { name: 'Sangrampunji', area: 'Jaflong, Gowainghat', nearestBazar: 'Jaflong Bazar', landmark: 'Blue mosque' },
    { name: 'Ratargul Para', area: 'Ratargul, Gowainghat', nearestBazar: 'Motorghat Bazar', landmark: 'Boat ghat' },
    { name: 'Lalakhal', area: 'Sari River, Jaintiapur', nearestBazar: 'Sarighat Bazar', landmark: 'Tea garden gate' },
  ],
  Bandarban: [
    { name: 'Bogalake Para', area: 'Ruma', nearestBazar: 'Ruma Bazar', landmark: 'Lake army camp' },
    { name: 'Ruma Bazar Para', area: 'Ruma', nearestBazar: 'Ruma Bazar', landmark: 'Ruma ghat' },
  ],
  Sunamganj: [
    { name: 'Golabari', area: 'Tanguar Haor, Tahirpur', nearestBazar: 'Tahirpur Bazar', landmark: 'Watch tower' },
    { name: 'Tekerghat', area: 'Tahirpur', nearestBazar: 'Barekka Bazar', landmark: 'Limestone lake' },
  ],
  Rangamati: [
    { name: 'Ruilui Para', area: 'Sajek, Baghaichhari', nearestBazar: 'Sajek Bazar', landmark: 'Helipad' },
    { name: 'Konglak Para', area: 'Sajek, Baghaichhari', nearestBazar: 'Sajek Bazar', landmark: 'Konglak hill top' },
  ],
};

// host email prefix → village
const hosts = [
  ['Rahima Begum', 'rahima', 'Sangrampunji', 'approved'],
  ['Karim Mia', 'karim', 'Sangrampunji', 'approved'],
  ['Abdul Hai', 'abdulhai', 'Sangrampunji', 'approved'],
  ['Jahanara Begum', 'jahanara', 'Sangrampunji', 'pending'],
  ['Shefali Rani', 'shefali', 'Ratargul Para', 'approved'],
  ['Nurul Islam', 'nurul', 'Lalakhal', 'approved'],
  ['Lalthang Bawm', 'lalthang', 'Bogalake Para', 'approved'],
  ['Abul Kashem', 'kashem', 'Golabari', 'approved'],
  ['Mong Thowai', 'mong', 'Ruilui Para', 'approved'],
];

const defaultRules = ['Please be back inside by 10 pm', 'No smoking inside the house', 'Tell the host before inviting other visitors'];

// [hostKey, listing fields]
const listings = [
  ['rahima', {
    title: 'Tin-roof family home beside the mango tree', pricePerNight: 1200, capacity: 4, rooms: 2, beds: '2 double beds', meals: true,
    description: "A quiet family home five minutes from the blue mosque, with a big courtyard and a view of the Khasia hills. Rahima's family lives in the main house; guests stay in the two rooms on the east side.",
    checklist: { toilet: 'outside', electricity: 'loadshedding', water: 'tubewell', network: 'good', bedding: 'provided', road: 'short_walk' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: false, soloFemaleOk: true, childrenOk: true },
    directions: 'From Jaflong Bazar, take a CNG toward Sangrampunji. Get down at the blue mosque, walk five minutes north — white tin-roof house beside the mango tree.',
    nearestLandmark: 'Blue mosque', nearestBazar: 'Jaflong Bazar',
    houseRules: [...defaultRules, 'Modest dress around the family is appreciated'],
  }],
  ['rahima', {
    title: 'Rooftop room with hill view', pricePerNight: 1400, capacity: 2, rooms: 1, beds: '1 double bed', status: 'pending',
    description: 'A new room on the roof with a clear view of the Meghalaya hills.',
    checklist: { toilet: 'attached', electricity: 'loadshedding', water: 'tubewell', network: 'good', bedding: 'provided', road: 'short_walk' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: true, soloFemaleOk: true, childrenOk: false },
    directions: 'Same house as the mango tree home — the stairs are on the left side of the courtyard.',
    nearestLandmark: 'Blue mosque', nearestBazar: 'Jaflong Bazar', houseRules: defaultRules,
  }],
  ['karim', {
    title: 'Simple room by the main road', pricePerNight: 900, capacity: 2, rooms: 1, beds: '1 double bed',
    description: 'Easy to reach — the CNG stops at the gate. Simple, clean room with a fan.',
    checklist: { toilet: 'outside', electricity: 'steady', water: 'tap', network: 'good', bedding: 'bring_own', road: 'vehicle' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: false, soloFemaleOk: false, childrenOk: true },
    directions: 'From Jaflong Bazar, CNG toward Sangrampunji. Get down at Karim Store, the house is right behind the shop.',
    nearestLandmark: 'Karim Store', nearestBazar: 'Jaflong Bazar', houseRules: defaultRules,
  }],
  ['abdulhai', {
    title: 'Two rooms with a separate entrance', pricePerNight: 1500, capacity: 6, rooms: 2, beds: '2 double beds, 1 single',
    description: 'Good for families or small groups — your own door to the yard.',
    checklist: { toilet: 'attached', electricity: 'loadshedding', water: 'pond', network: 'weak', bedding: 'provided', road: 'long_walk' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: true, soloFemaleOk: false, childrenOk: true },
    directions: 'From the blue mosque, take the field path east for ten minutes. Yellow house with a pond in front.',
    nearestLandmark: 'Blue mosque', nearestBazar: 'Jaflong Bazar', houseRules: defaultRules,
  }],
  ['shefali', {
    title: 'Swamp-forest home near the boat ghat', pricePerNight: 950, capacity: 3, rooms: 1, beds: '1 double, 1 single', meals: true,
    description: 'Wake up close to Ratargul swamp forest. The family can arrange a boat.',
    checklist: { toilet: 'shared', electricity: 'loadshedding', water: 'tubewell', network: 'weak', bedding: 'provided', road: 'short_walk' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: false, soloFemaleOk: true, childrenOk: true },
    directions: 'From Motorghat Bazar, walk toward the boat ghat. Third house on the right after the primary school.',
    nearestLandmark: 'Boat ghat', nearestBazar: 'Motorghat Bazar', houseRules: defaultRules,
  }],
  ['nurul', {
    title: 'Riverside room at Lalakhal', pricePerNight: 1400, capacity: 4, rooms: 2, beds: '2 double beds',
    description: 'A short walk to the blue-green Sari river. Solar power only, but the network is strong.',
    checklist: { toilet: 'attached', electricity: 'solar', water: 'tubewell', network: 'good', bedding: 'provided', road: 'vehicle' },
    safety: { familyOnSite: false, femaleMembersPresent: false, separateEntrance: true, soloFemaleOk: false, childrenOk: true },
    directions: 'From Sarighat Bazar, take the road to the tea garden gate. The house with a green gate just before it.',
    nearestLandmark: 'Tea garden gate', nearestBazar: 'Sarighat Bazar', houseRules: defaultRules,
  }],
  ['lalthang', {
    title: 'Lake-view bamboo house', pricePerNight: 1000, capacity: 4, rooms: 2, beds: 'Floor mattresses for 4', meals: true,
    description: 'A Bawm family home above Boga Lake. Sunrise over the water from the veranda.',
    checklist: { toilet: 'outside', electricity: 'solar', water: 'tap', network: 'weak', bedding: 'provided', road: 'long_walk' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: false, soloFemaleOk: true, childrenOk: false },
    directions: 'From the lake army camp, walk up the path to the left of the church. Bamboo house with a blue door.',
    nearestLandmark: 'Lake army camp', nearestBazar: 'Ruma Bazar', houseRules: ['Register at the army camp on arrival', ...defaultRules],
  }],
  ['kashem', {
    title: 'Haor-side room with a boat ghat', pricePerNight: 900, capacity: 3, rooms: 1, beds: '1 double, 1 single',
    description: 'Right on Tanguar Haor. In monsoon the water reaches the steps.',
    checklist: { toilet: 'outside', electricity: 'loadshedding', water: 'tubewell', network: 'none', bedding: 'provided', road: 'short_walk' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: false, soloFemaleOk: false, childrenOk: true },
    directions: 'From Tahirpur Bazar, take a boat or bike to the watch tower. The house is beside the ghat with red pillars.',
    nearestLandmark: 'Watch tower', nearestBazar: 'Tahirpur Bazar', houseRules: defaultRules,
  }],
  ['mong', {
    title: 'Cloud-view room in Sajek', pricePerNight: 1500, capacity: 3, rooms: 1, beds: '1 double, 1 single',
    description: 'Clouds below the window in the morning. A Tripura family home on the ridge.',
    checklist: { toilet: 'attached', electricity: 'solar', water: 'tap', network: 'good', bedding: 'provided', road: 'vehicle' },
    safety: { familyOnSite: true, femaleMembersPresent: true, separateEntrance: true, soloFemaleOk: true, childrenOk: true },
    directions: 'Jeeps stop at the Sajek helipad. Walk 200 m toward Konglak — wooden house with a flag.',
    nearestLandmark: 'Helipad', nearestBazar: 'Sajek Bazar', houseRules: defaultRules,
  }],
];

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany(), District.deleteMany(), Village.deleteMany(), Listing.deleteMany()]);

  const villageByName = {};
  for (const [districtName, villages] of Object.entries(districts)) {
    const district = await District.create({ name: districtName });
    for (const v of villages) {
      villageByName[v.name] = await Village.create({ ...v, district: district._id });
    }
  }

  // User.create (not insertMany) so the password hashing hook runs.
  await User.create({ name: 'Otithi Admin', email: 'admin@otithi.local', phone: '01700000000', password: 'admin123', role: 'admin', status: 'approved' });
  await User.create({ name: 'Tania Akter', email: 'tania@otithi.local', phone: '01711111111', password: 'password123', role: 'traveller', status: 'approved' });
  await User.create({ name: 'Mahmud Hasan', email: 'mahmud@otithi.local', phone: '01722222222', password: 'password123', role: 'traveller', status: 'pending' });

  const hostByKey = {};
  for (const [name, key, village, status] of hosts) {
    hostByKey[key] = await User.create({
      name, email: `${key}@otithi.local`, phone: '01XXXXXXXXX', password: 'password123',
      role: 'host', status, village: villageByName[village]._id,
    });
  }

  for (const [key, fields] of listings) {
    const host = hostByKey[key];
    await Listing.create({ status: 'approved', ...fields, host: host._id, village: host.village, photos: [] });
  }

  console.log(`Seeded ${Object.keys(districts).length} districts, ${Object.keys(villageByName).length} villages, ${hosts.length + 3} users, ${listings.length} rooms`);
  console.log('Admin:     admin@otithi.local / admin123');
  console.log('Traveller: tania@otithi.local / password123');
  console.log('Host:      rahima@otithi.local / password123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
