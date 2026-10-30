# Otithi — Implementation Plan

A homestay platform for remote-area tourism in Bangladesh. Student project (NUB CSE), built to run **fully offline on one laptop**. No cloud services.

---

## 1. Tech stack (all local)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router | `lucide-react` for icons, `axios` for API calls |
| Backend | Node.js + Express | REST API on `http://localhost:5000` |
| Database | **MongoDB Community Server (local)** + Mongoose | `mongodb://127.0.0.1:27017/otithi`, view with MongoDB Compass |
| Auth | JWT + bcryptjs | Token kept in `localStorage` |
| File uploads | multer | Saved to `server/uploads/`, served as static files |
| Fonts | Download Bricolage Grotesque and Hind Siliguri, self-host in `client/src/assets/fonts` | Keeps the app working with no internet |

There is no payment gateway, email or SMS service, or map API. Guests pay the host in cash.

---

## 2. Folder structure

```
otithi/
├── client/                  # React (Vite)
│   ├── src/
│   │   ├── api/axios.js     # baseURL + JWT header
│   │   ├── context/AuthContext.jsx
│   │   ├── components/      # Navbar, Footer, ChecklistChips, VillageCard, RoomCard, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Browse.jsx
│   │   │   ├── Village.jsx
│   │   │   ├── Listing.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── traveller/Dashboard.jsx
│   │   │   ├── host/Dashboard.jsx
│   │   │   ├── host/AddRoom.jsx
│   │   │   └── admin/Dashboard.jsx
│   │   ├── App.jsx          # routes
│   │   └── index.css
│   └── tailwind.config.js   # copy from the Style Guide artboard
└── server/
    ├── config/db.js
    ├── models/              # User, District, Village, Listing, Booking, Review, Report
    ├── routes/              # auth, locations, listings, bookings, reviews, reports, admin
    ├── controllers/
    ├── middleware/          # auth.js (verify JWT), role.js (host/admin/traveller), upload.js (multer)
    ├── uploads/             # ID documents and room photos
    ├── seed.js              # demo data + admin account
    ├── .env                 # PORT, MONGO_URI, JWT_SECRET
    └── server.js
```

---

## 3. Database models (Mongoose)

**User**
- `name`, `email` (unique), `phone`, `password` (hashed)
- `role`: `traveller | host | admin`
- `idDocument` (file path)
- `status`: `pending | approved | rejected`
- `village` (ref, for hosts only)

**District**: `name`

**Village**: `name`, `district` (ref), `nearestBazar`, `landmark`, `photo`

**Listing** (one room or house)
- `host` (ref User), `village` (ref)
- `title`, `description`, `pricePerNight`, `capacity`, `rooms`, `photos[]`
- `checklist`:
  - `toilet`: `attached | outside | shared`
  - `electricity`: `steady | loadshedding | solar`
  - `water`: `tap | tubewell | pond`
  - `network`: `good | weak | none`
  - `bedding`: `provided | bring_own`
  - `road`: `vehicle | short_walk | long_walk`
- `safety`: `familyOnSite`, `femaleMembersPresent`, `separateEntrance`, `soloFemaleOk`, `childrenOk` (all Boolean)
- `directions` (text), `nearestLandmark`, `nearestBazar`, `houseRules[]`
- `blockedDates[]` (Date)
- `status`: `pending | approved | rejected`

**Booking**
- `listing`, `guest`, `host` (refs)
- `checkIn`, `checkOut`, `guests`, `message`, `totalPrice`
- `status`: `requested | accepted | declined | cancelled | completed`
- `code` (e.g. `OT-7K2Q`, generated on accept)

**Review**
- `booking`, `author`, `target` (refs)
- `type`: `guest_to_host | host_to_guest`
- `rating` (1–5), `comment`
- `checklistAccurate`: `yes | mostly | no` (guest-to-host only)

**Report**: `booking`, `reporter`, `against`, `title`, `details`, `status` (`open | resolved`)

---

## 4. API routes

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Sign up with role + ID upload (multipart) |
| POST | `/api/auth/login` | public | Returns JWT + user |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/districts` | public | District list |
| GET | `/api/villages?district=` | public | Villages with household/room counts and starting price |
| GET | `/api/villages/:id` | public | Village + its approved listings |
| GET | `/api/listings?district=&village=&minPrice=&maxPrice=&guests=&toilet=&electricity=&network=&road=&soloFemaleOk=...` | public | Search + filters |
| GET | `/api/listings/:id` | public | Listing detail + reviews (exact directions hidden) |
| POST | `/api/listings` | approved host | Create listing (goes to `pending`) |
| PUT | `/api/listings/:id` | owner host | Edit listing |
| PUT | `/api/listings/:id/blocked-dates` | owner host | Set unavailable dates |
| GET | `/api/listings/mine` | host | Host's own listings |
| POST | `/api/bookings` | approved traveller | Send booking request |
| GET | `/api/bookings/mine` | traveller | My bookings (upcoming/completed/cancelled) |
| GET | `/api/bookings/host` | host | Incoming requests + history + guest review history |
| PUT | `/api/bookings/:id/accept` | host | Accept → generate code |
| PUT | `/api/bookings/:id/decline` | host | Decline |
| PUT | `/api/bookings/:id/cancel` | traveller | Cancel |
| PUT | `/api/bookings/:id/complete` | host | Mark completed (enter code) |
| POST | `/api/reviews` | both | Review after completed stay |
| GET | `/api/reviews/user/:id` | logged in | A user's received reviews |
| POST | `/api/reports` | both | Report a problem |
| GET | `/api/admin/users?status=pending` | admin | Pending verifications |
| PUT | `/api/admin/users/:id/approve` / `reject` | admin | Verify users |
| GET | `/api/admin/listings?status=pending` | admin | Pending listings |
| PUT | `/api/admin/listings/:id/approve` / `reject` | admin | Publish or reject |
| POST/DELETE | `/api/admin/districts`, `/api/admin/villages` | admin | Manage locations |
| GET/PUT | `/api/admin/reports`, `/api/admin/reports/:id/resolve` | admin | Handle reports |
| GET | `/api/admin/stats` | admin | Hosts, bookings, districts, income totals |

---

## 5. Frontend pages (match the design canvas)

| Route | Page | Canvas artboard |
|---|---|---|
| `/` | Home: hero search, villages, how it works | 01 Home |
| `/browse` | Filters sidebar + village/room results | 02 Browse |
| `/village/:id` | Village stats + households + group selection | 03 Village |
| `/listing/:id` | Photos, checklist, safety, directions, rules, reviews, request box | 04 Listing |
| `/booking/:id` | Request form → after accept: booking code + directions | 05 Booking |
| `/login`, `/register` | Role choice + ID upload, pending notice | 06 Auth |
| `/traveller` | My bookings, codes, write review, saved rooms | 07 Traveller |
| `/host` | Requests (accept/decline), calendar, rooms, mark completed, review guest | 08 Host |
| `/host/add-room` | 4-step wizard: details → photos → checklist → directions & safety | 09 Add room |
| `/admin` | Stats, verify users, approve listings, locations, reports | 10 Admin |

`ProtectedRoute` checks role. Unapproved users can browse but can't book or list.

---

## 6. Simple decisions for the design gaps

- **Directions:** the listing shows only the nearest landmark and bazar. Full directions and the host's phone appear after the host accepts.
- **Group booking:** no special logic. On the village page the traveller picks houses, and the frontend sends **one booking request per house**. Each house gets its own code.
- **Host reviews guest:** add a "Review guest" button on completed stays in the Host dashboard. It reuses the same review form.
- **Filters:** add water and bedding filters to Browse as well.
- **Saved rooms:** store the IDs in `localStorage` only, with no backend.
- **Left out of scope:** notifications, password reset, Bangla/English switch, online payment, maps.

---

## 7. Build order (about 3 weeks)

### Phase 1 — Setup (Day 1–2)
- [x] Node.js installed (v22)
- [ ] Install MongoDB Community Server (+ Compass): `brew trust mongodb/brew && brew install mongodb-community mongosh && brew services start mongodb-community`
- [x] React + Vite + Tailwind 3 client, Style Guide colours in `tailwind.config.js`, fonts bundled via `@fontsource` (offline)
- [x] `server`: express, mongoose, bcryptjs, jsonwebtoken, multer, cors, dotenv, nodemon
- [x] Local MongoDB connection (`config/db.js`) + `GET /api/health`
- [x] Shared components: Logo, Navbar (mobile menu), Footer, Layout, Button, Card, Chip, routes with placeholder pages
- [x] Root `npm run dev` starts API + web together (concurrently)

### Phase 2 — Auth & verification (Day 3–4)
- [x] User model, register with ID upload, login, JWT middleware, role middleware
  - ID photos go to `server/private/ids/` (not public); room photos will go to `server/uploads/`
- [x] Auth page (role choice, form, upload, "verification pending" banner)
- [x] AuthContext + ProtectedRoute (traveller / host / admin areas)
- [x] `seed.js`: admin account, 4 districts, 9 villages, travellers and hosts (listings added in Phase 3)

### Phase 3 — Listings (Day 5–8)
- [x] District, Village and Listing models + routes (search filters, village stats, owner edit → back to pending)
- [x] Host add-room wizard (4 steps, multer photos, checklist, safety, directions) + basic "My rooms" on host dashboard
- [x] Admin: stats, approve/reject users (view private ID photo), publish/reject listings
- [x] Browse page with filters in the URL, by-village / by-room views, mobile filter toggle
- [x] Village page (households + group planner UI) + Listing detail page (checklist, safety, landmark, rules, save)
- [x] Home: search box + featured villages; seed has 9 hosts and 9 rooms (1 pending)

### Phase 4 — Booking flow (Day 9–12)
- [x] Booking model + request route (verified traveller, future dates, ≤30 nights, capacity, no overlap with accepted stays or blocked dates, no duplicate requests)
- [x] Host: incoming requests with guest history (completed stays; reviews added in Phase 5), accept (generate `OT-XXXX`, auto-decline overlapping requests) or decline
- [x] Traveller: My bookings tabs, booking page with code + directions/phone unlocked, cancel, saved rooms
- [x] Host: availability calendar (tap to block/unblock), mark completed by entering the code (from check-in day)
- [x] Village page: tick several houses → group split across houses → one request per house
- [x] Seed: 8 demo bookings (one checks in today: code `OT-5RT8` at Rahima's)

### Phase 5 — Reviews, reports, admin (Day 13–16)
- [ ] Review model: guest → host (with "checklist accurate?") and host → guest
- [ ] Show reviews and "% say the checklist was accurate" on the listing
- [ ] Report button (listing / booking) → admin reports list → resolve
- [ ] Admin: location management + stats cards
- [ ] Host dashboard stats (nights hosted, total earned in cash)

### Phase 6 — Polish & demo (Day 17–20)
- [ ] Responsive check at phone width
- [ ] Empty states, loading states, form validation messages
- [ ] Fill the seed data with realistic Sylhet / Bandarban / Sunamganj / Rangamati examples
- [ ] Test the full flow: register host → admin approves → add room → admin publishes → traveller requests → host accepts → code → complete → both review
- [ ] Write the README (how to run) and take screenshots for the report

---

## 8. Running locally

```bash
# 1. Start MongoDB (once; it stays running as a background service)
brew services start mongodb-community

# 2. First time only
npm run install:all                 # root + server + client
cp server/.env.example server/.env  # PORT, MONGO_URI, JWT_SECRET

# 3. Every time (from the project root)
npm run dev        # API on http://localhost:5000, website on http://localhost:5173

# From Phase 2:
npm --prefix server run seed        # demo data + admin@otithi.local / admin123
```

---

## 9. Team split (suggested)

| Member | Owns |
|---|---|
| Md. Shalman Shah (lead) | Backend setup, auth, booking logic, admin API, integration |
| Tania Akter | Home, Browse, Village, Listing, Booking pages |
| Ahnaf Sahriar Siyam | Auth page, Traveller / Host / Admin dashboards, Add-room wizard |

Everyone: seed data, testing, report.
