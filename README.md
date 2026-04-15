# Student Interview Tracking System

Production-oriented full-stack app for tracking mock interviews with **Admin**, **Interviewer**, and **Student** roles.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts  
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT  
- **Exports:** Excel (`xlsx`), PDF (`pdfkit`)

## Prerequisites

- Node.js 18+
- MongoDB 6+ **or** Docker (for `docker compose`)

## Quick start (recommended)

From the **project root** (this folder):

```bash
npm install                    # installs concurrently for the dev script
npm run install:all            # backend + frontend dependencies
cp backend/.env.example backend/.env   # if you do not already have backend/.env
npm run mongo                  # starts MongoDB in Docker (port 27017)
npm run dev                    # runs API on :5000 and UI on :5173 together
```

Open **http://127.0.0.1:5173** or **http://localhost:5173**.  
API health: **http://localhost:5000/api/health** (`database` should become `connected` after MongoDB is up).

**Demo data:** On first start with an **empty** database (non-production), the API **auto-seeds** demo users and interviews. You can also run manually:

```bash
cd backend && npm run seed
```

The **Sign in** page shows one-click **Demo logins** (same as below).

### Manual start (two terminals)

1. **MongoDB** — `npm run mongo` from root, or your own Mongo on `mongodb://127.0.0.1:27017`
2. **Backend:** `cd backend && npm run dev`
3. **Frontend:** `cd frontend && npm run dev`

### `ERR_CONNECTION_REFUSED` in the browser

Usually nothing is listening on that port:

| Symptom | Fix |
|--------|-----|
| Page **localhost:5173** refused | Start the frontend: `cd frontend && npm run dev`, or use **`npm run dev` from the project root** (uses `scripts/dev.cjs` so the correct folders are used). |
| Login/API calls fail (proxy to **:5000**) | Start the backend: `cd backend && npm run dev`. Check `http://localhost:5000/api/health`. |
| Health shows `database: disconnected` | Start MongoDB: `npm run mongo` from project root, or install/start Mongo locally. The API binds to port **5000** even if Mongo is slow; it retries connecting in the background. |
| You ran `npm run dev` but API still refused | The app loads **`backend/.env` from the file path**, not from the current folder. If the server exited immediately, open a terminal in the project and run `cd backend && node src/server.js` once and read the error (often missing `JWT_SECRET` or Mongo not running). |

**Important:** Your project folder is named `Tracker ` (with a **trailing space**). Some terminals or scripts break if the path is not quoted. Prefer opening the folder in your IDE and running commands from there, or rename the folder to `Tracker` without the space.

### Verify the stack

```bash
# Terminal 1 — Mongo (Docker)
npm run mongo

# Terminal 2 — from project root
cd backend && node src/server.js
# Should print: API server: http://localhost:5000

# Terminal 3
curl -s http://127.0.0.1:5000/api/health
```

Then in another terminal: `cd frontend && npm run dev` and open **http://127.0.0.1:5173**.

API base: `http://localhost:5000`  
Health check: `GET /api/health`

### 4. Demo accounts (password for **all**: `demo123`)

| Role | Login |
|------|--------|
| Admin | `admin@tracker.local` |
| Interviewers | `sarah@tracker.local`, `james@tracker.local`, `maria@tracker.local` |
| Students | Roll numbers: `CS2024001`, `CS2024002`, `CS2024015`, `CS2024022`, `CS2024030` |

Disable auto-seed: set `AUTO_SEED=false` in `backend/.env`.

## API overview

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` | Interviewer / Student registration |
| POST | `/api/auth/login` | Email+password (staff) or roll+password (student) |
| GET | `/api/auth/me` | Authenticated user |
| POST | `/api/interviews` | Interviewer |
| GET | `/api/interviews` | Admin (filters: `interviewType`, `minScore`, `maxScore`, `interviewerId`) |
| GET | `/api/interviews/student/:rollNumber` | Admin, Student (own roll only) |
| GET | `/api/interviews/interviewer/:id` | Admin, Interviewer (own id only) |
| GET | `/api/analytics/dashboard` | Admin |
| GET | `/api/analytics/leaderboard` | Admin |
| GET | `/api/export/excel` | Admin (same query filters as interviews list) |
| GET | `/api/export/pdf` | Admin |

Send `Authorization: Bearer <token>` for protected routes.

## Project layout

```
backend/src/
  config/       # database
  controllers/
  middleware/ # auth, validators
  models/
  routes/
  seed/
  utils/
frontend/src/
  api/
  components/
  context/      # AuthContext
  pages/
```

## Production notes

- Set a strong `JWT_SECRET` and HTTPS in production.  
- Restrict CORS via `CLIENT_ORIGIN`.  
- Run `npm run build` in `frontend` and serve `frontend/dist` behind nginx or similar.  
- Use a managed MongoDB cluster for production data.

## Deploy on Vercel (from GitHub)

Deploy as **2 Vercel projects** from the same repository:

### 1) Backend API project

- Import repo in Vercel.
- **Root Directory:** `backend`
- Framework preset: **Other**
- This repo includes `backend/api/[...all].js` for Vercel serverless routing.

Set backend environment variables in Vercel:

- `MONGODB_URI` = your Atlas/managed Mongo connection string
- `JWT_SECRET` = long random secret
- `JWT_EXPIRES_IN` = `7d` (or your value)
- `NODE_ENV` = `production`
- `USE_MEMORY_DB` = `false`
- `CLIENT_ORIGIN` = your frontend Vercel URL (for CORS)

After deploy, confirm:

- `https://<backend-domain>/api/health`

### 2) Frontend project

- Import same repo in Vercel again.
- **Root Directory:** `frontend`
- Framework preset: **Vite**

Set frontend environment variable:

- `VITE_API_BASE_URL` = `https://<backend-domain>`

Then redeploy frontend and open the app URL.

### Notes

- Frontend calls API as `${VITE_API_BASE_URL}/api/...`.
- Do not use embedded MongoDB (`USE_MEMORY_DB=true`) on Vercel production.
