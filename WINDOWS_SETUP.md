# Otithi: Setting up on Windows

This takes about 20 minutes the first time and needs internet for the downloads. After that, the app runs fully offline.

You will install three programs (Node.js, MongoDB and Git), then run five commands.

---

## Step 1: Install Node.js

1. Go to **https://nodejs.org** and download the **LTS** version (22 or newer).
2. Run the installer and keep all the default options.
3. Open **PowerShell** (Start menu → type `PowerShell`) and check:

   ```powershell
   node -v
   npm -v
   ```

   You should see version numbers, such as `v22.x.x`. **Node must be 20.19 or newer.**

> If `node` is "not recognized", close PowerShell and open it again. The installer only updates PATH for new windows.

---

## Step 2: Install MongoDB (the database)

1. Go to **https://www.mongodb.com/try/download/community**.
2. Choose **Version:** latest, **Platform:** Windows, **Package:** `msi`. Download it.
3. Run the installer:
   - Choose **Complete**.
   - On the **Service Configuration** screen, keep **"Install MongoDB as a Service"** ticked. Leave the other settings as they are.
   - Keep **"Install MongoDB Compass"** ticked. Compass is an app for viewing the data, and it's useful for your demo.
4. Finish the installer.

**Check that it is running:**
- Open **Services** (Start menu → type `services`), find **MongoDB Server (MongoDB)** and check that its Status says **Running**.
- Or open **MongoDB Compass**, click **Connect** with `mongodb://localhost:27017`, and it should connect.

MongoDB now starts by itself every time Windows starts. You don't have to start it yourself.

---

## Step 3: Install Git

1. Download from **https://git-scm.com/download/win** and install it with the default options.
2. Check in a **new** PowerShell window:

   ```powershell
   git --version
   ```

---

## Step 4: Get the project code

**Option A: from GitHub (recommended)**

```powershell
cd $HOME\Documents
git clone <REPO-URL> otithi
cd otithi
```

Replace `<REPO-URL>` with the link the team lead shares.

**Option B: from a USB drive or zip file**

Copy the project folder anywhere, for example `Documents\otithi`. **Do not copy the `node_modules` folders**, because they are huge and built for the other computer. Then open that folder in PowerShell:

```powershell
cd $HOME\Documents\otithi
```

> Tip: in File Explorer, open the project folder, click the address bar, type `powershell` and press Enter. PowerShell opens already in that folder.

---

## Step 5: First-time setup (run once)

Run these in PowerShell, **inside the project folder**:

```powershell
# 1. Install all packages (takes 1–3 minutes)
npm run install:all

# 2. Create the settings file
Copy-Item server\.env.example server\.env

# 3. Load the demo data (villages, rooms, users, bookings)
npm --prefix server run seed
```

The last command should print:

```
MongoDB connected: 127.0.0.1/otithi
Seeded 4 districts, 9 villages, 13 users, 9 rooms, 8 bookings, 5 reviews, 2 reports
```

> Using **Command Prompt (cmd)** instead of PowerShell? Use `copy server\.env.example server\.env` for step 2. Everything else is the same.

---

## Step 6: Run the app (every time)

```powershell
npm run dev
```

Wait until you see these two lines:

```
[api] Otithi API running on http://localhost:5050
[web]   ➜  Local:   http://localhost:5173/
```

Then open **http://localhost:5173** in your browser.

To **stop** the app, click in the PowerShell window and press **Ctrl + C** (answer `Y` if asked).

> If Windows Firewall asks about Node.js, click **Allow** (private networks are enough).

---

## Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@otithi.local` | `admin123` |
| Traveller | `tania@otithi.local` | `password123` |
| Host | `rahima@otithi.local` | `password123` |

More accounts and a 5-minute demo script are in **README.md**.

---

## Everyday commands

| What | Command |
|---|---|
| Start the app | `npm run dev` |
| Reset the demo data | `npm --prefix server run seed` ⚠️ deletes everything in the database first |
| Get teammates' latest code | `git pull`, then `npm run install:all` if packages changed |
| Look at the data | Open **MongoDB Compass** → connect → database **otithi** |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| **`running scripts is disabled on this system`** when typing `npm` | PowerShell is blocking npm's script. Run this once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and answer `Y`. Or use **Command Prompt** instead. |
| **`'node' is not recognized`** or **`'npm' is not recognized`** | Close and reopen PowerShell. If it still fails, reinstall Node.js and make sure "Add to PATH" is ticked. |
| **`MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`** | MongoDB isn't running. Open **Services**, find **MongoDB Server (MongoDB)** and click **Start**. If it isn't listed, reinstall MongoDB with "Install as a Service" ticked. |
| Seed or app is **very slow to connect, then fails** | Make sure `server\.env` says `MONGO_URI=mongodb://127.0.0.1:27017/otithi`. Use `127.0.0.1`, **not** `localhost`. |
| **`EADDRINUSE: address already in use :::5050`** | Another copy is already running. Close other PowerShell windows running `npm run dev`. To see what holds the port, run `netstat -ano \| findstr :5050`, then end that PID in Task Manager → Details. |
| Port **5173** is busy | Vite picks the next free port (5174…). Use the address it prints. |
| Website opens but **"Something went wrong. Is the server running?"** | The API part didn't start. Scroll up in PowerShell for a red `[api]` error (usually the MongoDB problem above). |
| **`Cannot find module ...`** after `git pull` | Run `npm run install:all` again. |
| **`npm ERR! EBADENGINE`** or Mongoose complains about the Node version | Node is too old. Install the current LTS from nodejs.org. |
| Uploads fail with **"File is too large"** | ID photos and room photos must be JPG, PNG or WEBP and under 5 MB. |
| You copied the folder and things act strangely | Delete `node_modules`, `server\node_modules` and `client\node_modules`, then run `npm run install:all`. |

---

## Good to know

- **Everything is local.** The database lives on your PC (by default in `C:\Program Files\MongoDB\Server\<version>\data`). There's no internet or cloud account needed after setup.
- **Each teammate has their own database.** Bookings you make don't appear on a teammate's PC. Everyone runs the seed to get the same demo data.
- **Uploaded files** go to `server\uploads` (room photos) and `server\private\ids` (ID photos). These aren't stored in Git.
- **Don't commit `server\.env`.** Git already ignores it.
