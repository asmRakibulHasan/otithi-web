# Otithi: Remaining Work

*Last updated: 31 Oct 2026, at the end of the build session.*

## Where things stand

**The app is complete and working.** All 6 phases in `IMPLEMENTATION_PLAN.md` are built and committed:

| Commit | Phase |
|---|---|
| `b2ad6c0` | 1 · Project setup |
| `b346946` | 2 & 3 · Accounts, ID verification, rooms, browsing, admin approvals |
| `4710e55` | 4 · Booking flow (request → accept → code → complete) |
| `5487084` | 5 · Reviews, reports, locations, admin stats |
| `c9e0270` | 6 · Polish, bug fixes, README, screenshots |

**Testing done:**
- A full 12-step journey in a real (headless) browser on this Mac's local MongoDB: sign-up, approval, add room, publish, request, accept, code, complete, two-way reviews, report. Every step passed with no errors.
- 106 API checks, run during the build session.
- All 11 pages checked at desktop and phone width.

**Not tested:** a real Windows PC, or a manual click-through by a person.

---

## 1. Do these first

- [ ] **Commit the last two files.** They were written after the final commit:
  ```bash
  git add WINDOWS_SETUP.md README.md REMAINING_WORK.md
  git commit -m "Add Windows setup guide and remaining work list"
  ```
- [ ] **Push to a private GitHub repo** so teammates can get the code:
  ```bash
  # create an empty PRIVATE repo on github.com first (no README), then:
  git remote add origin https://github.com/<you>/otithi.git
  git branch -M main
  git push -u origin main
  ```
  Then add Tania and Ahnaf as collaborators (repo → Settings → Collaborators).
- [ ] **Fill in the repo link** in `WINDOWS_SETUP.md`, Step 4, where it says `<REPO-URL>`.
- [ ] **Have a teammate follow `WINDOWS_SETUP.md` on Windows** and note anywhere they get stuck. It hasn't been tried on Windows yet.
- [ ] **Click through the app yourself** using the demo script in `README.md` (about 30 minutes). Write down anything that looks wrong or confusing.

## 2. Small technical fixes (about 15 minutes)

- [ ] **Update React Router.** `npm audit` reports a known security issue in `react-router-dom` 6.28 (open-redirect XSS). The fix is a minor upgrade within version 6:
  ```bash
  npm --prefix client install react-router-dom@6.30.1
  npm --prefix client run build     # check it still builds
  ```
  Use the newest 6.x version npm offers. Don't jump to version 7, because it changes APIs.
- [ ] **esbuild warning** (from Vite 5). This only affects the local development server, not the app itself. It's safe to ignore for a local student project. Upgrading Vite to 6 or newer would fix it, but test afterwards.
- [ ] **Change the login secret.** `server/.env` still has `JWT_SECRET=change_this_secret`. That's fine on a laptop. If the app is ever put on a shared machine or a server, replace it with a long random string.

## 3. Project deliverables

- [ ] **Project report.** Suggested chapters, with what already exists for each:

  | Chapter | Source |
  |---|---|
  | Introduction, problem, objectives | the two proposal PDFs |
  | System design and architecture | `IMPLEMENTATION_PLAN.md` §1–2 |
  | Database design (7 collections) | `IMPLEMENTATION_PLAN.md` §3, `server/models/` |
  | API design | `IMPLEMENTATION_PLAN.md` §4 |
  | Features and screenshots | `README.md` features table, `docs/screenshots/` (15 images) |
  | Business rules (verification, double-booking prevention, privacy) | `README.md` "Rules the app enforces" |
  | Testing | 12-step browser journey and 106 API checks (see the note on test scripts below) |
  | Limitations and future work | sections 4 and 5 of this file |

- [ ] **Presentation slides and the live demo.** Follow the demo script in `README.md`. Run `npm --prefix server run seed` just before presenting so the data is fresh. Remember that it **wipes** the database.
- [ ] **Viva preparation.** Likely questions:
  - Why MongoDB and not SQL? (It's in the approved MERN proposal, it runs fully locally, and the flexible checklist and safety fields fit documents well.)
  - How do you prevent double bookings? (An overlap check against accepted stays and blocked dates; accepting a request automatically declines other requests for the same dates.)
  - Why no online payment? (Rural hosts have no merchant accounts, and keeping money out of the platform removes the main reason families would refuse to join.)
  - How is the ID document kept private? (It's stored outside the public folder, and only an admin can fetch it, through a protected API route.)
  - Why Bangladesh time (UTC+6) for dates? (The platform is Bangladesh-only, so check-in and "today" must match local days.)

## 4. Optional features (if time allows)

In rough order of value for the demo:

| Feature | Effort | Notes |
|---|---|---|
| **Real photos in the demo data** | Small | Log in as each host → add-room wizard, or put images in `server/uploads/` and set `photos: ['/uploads/name.jpg']` in `server/seed.js`. Right now every room shows the hills illustration. |
| **Edit a room** (host) | Small–Medium | The server already supports it (`PUT /api/listings/:id`, which sends the room back to admin review). Only the screen is missing; it can reuse `client/src/pages/host/AddRoom.jsx`. |
| **Bangla / English switch** | Medium | Rural hosts would likely need Bangla. The Hind Siliguri font already supports Bangla. Needs a translations file and a toggle in the navbar. |
| **Password reset** | Small (offline version) | No email or SMS is possible offline, so the simplest version is the admin setting a temporary password from the admin panel. |
| **Admin: suspend a user / delete a room** | Small | Useful when acting on reports. Today the admin can only reject users and rooms that are still pending. |
| **Delete individual photos** when editing a room | Small | Comes with "Edit a room". |
| **Notifications** (e.g. a badge for new requests) | Medium | The host dashboard already shows counts; a navbar badge would be a nice touch. |

## 5. Known limitations (mention in the report)

- Saved rooms are stored in the browser only (`localStorage`), not in the account.
- No email or SMS. The app runs offline by design.
- One booking reserves the whole listing (house or room) for those dates. There's no per-bed booking.
- Search loads all matching rooms at once with no pagination. That's fine for demo-sized data.
- **The test scripts were not saved in the repo.** The API checks and the browser journey script lived in a temporary session folder. If automated tests are needed for the report, ask Claude to recreate them as `server/tests/` (API) and `e2e/` (Playwright).

---

## Quick reference

```bash
npm run dev                       # start (API :5050 + website :5173)
npm --prefix server run seed      # reset demo data (WIPES the database)
brew services start mongodb-community   # macOS: start MongoDB if it's stopped
```

| Role | Email | Password |
|---|---|---|
| Admin | `admin@otithi.local` | `admin123` |
| Traveller | `tania@otithi.local` | `password123` |
| Host | `rahima@otithi.local` | `password123` |

## Resuming with Claude Code

Open Claude Code in this folder and say, for example:

> Read REMAINING_WORK.md and IMPLEMENTATION_PLAN.md, then help me with [item].

These files hold everything needed to continue: `README.md` covers how to run the app and the rules it enforces, `IMPLEMENTATION_PLAN.md` covers the data model and API, and this file lists what's left.
