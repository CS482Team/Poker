# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

Multiplayer five-card draw poker web app (CS482 team project, GitHub org `CS482Team`). Rules: antes, fixed-limit betting (small bet before the draw, big bet after). The project is an early skeleton: no game logic or database schema exists yet.

Two independent npm packages; there is no root `package.json` or workspace setup, so run commands inside each directory.

- `frontend/`: Next.js 16 (App Router) + React 19 + Tailwind CSS v4, TypeScript. Port 3000.
- `backend/`: Express 5 + Socket.IO 4 on a shared HTTP server, TypeScript run via `tsx`. Port 4000.
- Supabase (`@supabase/supabase-js`) is installed in both packages but not yet used anywhere.
- Real-time play is intended to go over Socket.IO (`socket.io-client` is installed in the frontend, also not yet used).

## Commands

Requires Node.js 20+. Install with `npm install` in each of `frontend/` and `backend/`.

Frontend (`cd frontend`):
- `npm run dev`: dev server at http://localhost:3000 (Turbopack)
- `npm run build` / `npm start`
- `npm run lint`: ESLint (flat config extending `eslint-config-next` core-web-vitals + typescript)

Backend (`cd backend`):
- `npm run dev`: `tsx watch src/index.ts`, serves http://localhost:4000 (`GET /health` returns `{ ok: true }`)
- `npm run build`: `tsc`
- `npm start`: `node dist/index.js`
- `npm test`: `jest` (ts-jest; run one file with `npx jest src/path/to/file.test.ts`)
- Typecheck only: `npx tsc --noEmit`

## Testing (TDD)

The team works test-first: write a failing test, make it pass with the smallest change, then refactor. When adding a feature, write and run the failing test before the implementation.

- Backend tests live next to the code as `src/**/*.test.ts` and are excluded from the `tsc` build.
- HTTP routes are tested with `supertest` against `app` from `src/app.ts`, which is why the Express app is kept separate from `src/index.ts` (the entry point that attaches Socket.IO and listens on the port).
- Keep game logic in pure functions (state in, new state out) so it can be tested without sockets. Pass randomness in as a parameter (e.g. an `rng` argument for shuffling) so tests are deterministic.
- The frontend has Testing Library + jsdom installed but no Jest config or `test` script yet.

## Environment

Copy the templates and fill them in (`.env` files are gitignored):
- `frontend/.env.example` → `frontend/.env`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`)
- `backend/.env.example` → `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

The service key is backend-only; never expose it to the frontend (only `NEXT_PUBLIC_*` vars reach the browser).

## Architecture notes

- `backend/src/app.ts` defines the Express app (CORS, `/health`). `backend/src/index.ts` wraps it in `http.createServer`, attaches a Socket.IO `Server` and listens. Port 4000 and the Socket.IO CORS origin (`http://localhost:3000`) are hardcoded; `dotenv` is installed but not yet loaded, so `backend/.env` is not read until someone adds `import "dotenv/config"` to `index.ts` (needed once the backend uses Supabase).
- The backend compiles as CommonJS (no `"type": "module"` in `package.json`) to keep Jest simple. TypeScript is pinned to 6 because ts-jest does not support TypeScript 7. `tsconfig.json` builds `src/` into `dist/` and is strict, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- Frontend lives in `frontend/app/` (`layout.tsx`, `page.tsx`, `globals.css`). The `@/*` path alias maps to `frontend/`. Tailwind v4 is loaded via `@import "tailwindcss"` in `globals.css` and the `@tailwindcss/turbopack` loader in `next.config.ts` (no `tailwind.config` or PostCSS config).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Next 16 has APIs and conventions that differ from older versions (e.g. the global `LayoutProps<"/">` type used in `layout.tsx`); check the Next 16 docs before assuming older patterns.

## Git workflow

- `main` is the default branch; integration happens on `develop`.
- Feature branches are named `feature/<issue#>-<slug>` (e.g. `feature/3-initialize-the-project`) and merged into `develop` via PR.
- Commit messages are prefixed with the issue number, e.g. `#3 init frontend and backend`.
