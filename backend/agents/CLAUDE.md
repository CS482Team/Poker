# Backend: CLAUDE.md
Guidance for Claude Code when working in `backend/`.

## Overview

Backend for a multiplayer five-card draw poker web app (CS482 team project, GitHub org `CS482Team`). Rules: antes, fixed-limit betting (small bet before the draw, big bet after).

- Express 5 + Socket.IO 4 on a shared HTTP server, TypeScript run via `tsx`. Port 4000.
- Real-time play goes over Socket.IO.
- Supabase (`@supabase/supabase-js`) is installed but not yet used.
- `frontend/` is a separate npm package (Next.js); there is no root `package.json` or workspace setup.

## Commands

Requires Node.js 20+. Run everything from `backend/`, after `npm install`.

- `npm run dev`: `tsx watch src/index.ts`, serves http://localhost:4000 (`GET /health` returns `{ ok: true }`)
- `npm run build`: `tsc`, outputs to `dist/`
- `npm start`: `node dist/index.js`
- `npm test`: `jest` (ts-jest; run one file with `npx jest src/path/to/file.test.ts`)
- Typecheck only: `npx tsc --noEmit`

## Testing (TDD)

The team works test-first: write a failing test, make it pass with the smallest change, then refactor. When adding a feature, write and run the failing test before the implementation.

- Tests live next to the code as `src/**/*.test.ts` and are excluded from the `tsc` build.
- HTTP routes are tested with `supertest` against `app` from `src/app.ts`, which is why the Express app is kept separate from `src/index.ts` (the entry point that attaches Socket.IO and listens on the port).
- Keep game logic in pure functions (state in, new state out) so it can be tested without sockets. Pass randomness in as a parameter (e.g. an `rng` argument for shuffling) so tests are deterministic.
- ts-jest compiles each file on its own (`isolatedModules`), so some type errors don't fail tests. Run `npx tsc --noEmit` as well as `npm test`.

## Environment

Copy `.env.example` to `.env` (gitignored) and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. The service key is backend-only and must never be sent to the frontend.

`dotenv` is installed but not yet loaded, so `.env` is not read until someone adds `import "dotenv/config"` to `src/index.ts` (needed once the backend uses Supabase).

## Architecture notes

- `src/app.ts` defines the Express app (CORS, `/health`). `src/index.ts` wraps it in `http.createServer`, attaches a Socket.IO `Server` and listens. Port 4000 and the Socket.IO CORS origin (`http://localhost:3000`) are hardcoded.
- The backend compiles as CommonJS (no `"type": "module"` in `package.json`) to keep Jest simple, so relative imports have no file extension (`import { app } from "./app"`).
- TypeScript is pinned to 6 because ts-jest does not support TypeScript 7.
- `tsconfig.json` builds `src/` into `dist/` and is strict, including `noUncheckedIndexedAccess` (indexing an array gives `T | undefined`) and `exactOptionalPropertyTypes` (prefer `| null` over optional `?` fields in state).

## Git workflow

- `main` is the default branch; integration happens on `develop`.
- Feature branches are named `feature/<issue#>-<slug>` (e.g. `feature/3-initialize-the-project`) and merged into `develop` via PR.
- Commit messages are prefixed with the issue number, e.g. `#3 init frontend and backend`.
