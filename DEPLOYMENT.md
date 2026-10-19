# DEPLOYMENT.md

This repository is configured to deploy to Vercel as a multi-service project (frontend + backend).

What I added to the repo

- vercel.json — multi-service configuration (frontend: Create React App; backend: FastAPI). Top-level rewrites:
  - /api/* -> backend
  - /* -> frontend
  - frontend installCommand set to `npm install --legacy-peer-deps` to temporarily unblock a dependency mismatch during build.

- Frontend changes:
  - frontend/package.json: downgraded `date-fns` to ^3.x and added `ajv` to satisfy CRA build-time dependencies.
  - frontend/src/lib/api.js: API client now defaults to `/api` (so the browser calls the backend via Vercel rewrite). Optional local override with REACT_APP_BACKEND_URL is still supported.
  - Fixed a couple of ESLint react-hooks/exhaustive-deps warnings in FAQ.jsx and Gallery.jsx.

- Backend changes:
  - Removed an unresolvable dependency `emergentintegrations==0.2.0` from backend/requirements.txt (it wasn't available on PyPI and caused the build to fail).

Environment variables (what you must set on Vercel)

Do NOT commit secrets into the repo. For Vercel, set these in Project → Settings → Environment Variables.

Required for backend (minimum):

- MONGO_URL
  - Must be a cloud-accessible MongoDB URI (Vercel cannot reach mongodb://localhost:27017).
  - Example (MongoDB Atlas):
    mongodb+srv://<user>:<password>@cluster0.abcd.mongodb.net/<dbname>?retryWrites=true&w=majority

- DB_NAME
  - The name of the database your app will use (e.g., test_database)

Optional / recommended:

- ERP_WEBHOOK_SECRET — if you use the ERP webhook endpoint
- CORS_ORIGINS — comma-separated list of allowed origins (server defaults to "*" if unset). For production set to `https://your-production-domain`.
- Any WhatsApp/Twilio or email provider credentials used by backend/whatsapp.py and backend/auth.py

How to add env vars on Vercel

1. Go to your project in the Vercel dashboard.
2. Settings -> Environment Variables.
3. Add the keys above for the environments you need (Production and/or Preview and/or Development).
4. After adding, trigger a new deployment (push to main or click Deploy). The build will pick up the variables.

Local development

- Use local .env files for development (do NOT commit). Example: create backend/.env with:

MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"

- Start backend locally (example):

python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.server:app --reload --host 0.0.0.0 --port 8000

- Start frontend locally:

cd frontend
npm install --legacy-peer-deps
npm start

- In local development you can point the frontend to a local backend by setting REACT_APP_BACKEND_URL:

# in frontend/.env.local
REACT_APP_BACKEND_URL=http://localhost:8000

Notes & follow-ups

- The current vercel.json uses `npm install --legacy-peer-deps` to bypass a dependency conflict during install. This is a temporary measure. Recommended next steps:
  1. Produce and commit a lockfile (package-lock.json or yarn.lock) from a local `npm install`/`yarn install` so installs are deterministic on Vercel.
  2. Remove the legacy-peer-deps installCommand from vercel.json.

- There were many audit warnings when installing frontend dependencies. Consider updating dependencies and running `npm audit fix` where safe.

- If you plan to use a private PyPI index for Python dependencies (instead of removing packages), set `PIP_EXTRA_INDEX_URL` as a Vercel environment variable with the index URL and credentials as needed.

If you want, I can:
- Prepare a PR that adds a lockfile (package-lock.json) — I will generate it locally and include it in a branch for you to test.
- Remove the temporary `installCommand` after you confirm the lockfile works.
- Help you add the exact env var values into Vercel (I will provide the exact commands/steps, but you must enter the secrets into the Vercel dashboard).

Tell me which next step you want me to take.