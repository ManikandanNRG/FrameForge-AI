# Runbook

## Prerequisites
- Node.js (LTS recommended; tested on Node 23).
- npm. Optional: nvm4w to switch Node versions.

## First setup
```powershell
npm install
# .env is generated locally; if missing, copy .env.example and fill SESSION_SECRET/AUTH_PASSCODE
npm run db:migrate     # create SQLite db + apply migration
npm run db:seed        # create owner user + demo project + media folder
```
If `DATABASE_URL` is unset, copy `.env.example` to `.env` and set a 32+ char
`SESSION_SECRET` (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

## Run the app (web + worker together)
```powershell
npm run dev
# web:  http://localhost:3000  (Next picks another port, e.g. 3001, if 3000 is busy)
# Sign in at /login with AUTH_PASSCODE (default "frameforge")
```

## Run only the web app or only the worker
```powershell
npm run dev:web
npm run worker
```

## Checks
```powershell
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run test        # vitest unit tests
npx tsx scripts/verify-phase0.ts   # end-to-end queue + media verification (no AI calls)
```

## Useful endpoints (signed in)
- `GET /api/health` — liveness/readiness (DB ping).
- `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/logout`.
- `GET|POST /api/projects` — list/create projects.
- `GET|POST /api/jobs` — list/enqueue jobs (ECHO only in Phase 0).
- `GET|POST /api/media/roots` — manage local media roots.
- `POST /api/media/list`, `POST /api/media/checksum`.

## Database
```powershell
npm run db:studio    # Prisma Studio GUI
```

## Troubleshooting
- **Port 3000 in use:** Next uses another port; check the dev output for the URL.
- **`Invalid environment configuration`:** a required `.env` value is missing —
  set `DATABASE_URL`, `SESSION_SECRET` (32+ chars), `AUTH_PASSCODE`.
- **401 on protected endpoints:** not signed in; `POST /api/auth/login` first.
- **Job stuck QUEUED:** the worker isn't running. Start it with `npm run worker`
  or use `npm run dev` (which starts both).
- **Media "offline":** the registered folder/drive is missing or unmounted.
- **`ffmpeg` not found:** expected — FFmpeg is not needed until Phase 4 and is
  not installed yet.
