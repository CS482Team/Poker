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

## Folder structure

MVC, with the poker game engine kept separate from the network and database layers so the card mechanics can be unit tested on their own (design doc, section 4.1).

```
src/
  config/      configuration and environment (e.g. Supabase client setup)
  controller/  request handlers: validate input, call game/ or model/, shape the response
  game/        the poker engine: pure functions over plain GameState data (deck, dealing, betting, hand evaluation)
  model/       data access and types for database tables (Supabase)
  route/       Express REST route definitions (accounts, friends, tables, adverts)
  socket/      Socket.IO event handlers for live gameplay; thin layer over game/
  util/        small shared helpers
  app.ts       Express app (CORS, /health)
  index.ts     entry point: HTTP server + Socket.IO + listen
```

- `game/` must not import from `controller/`, `route/`, `socket/` or `model/`. Those layers call into `game/`, never the other way round.
- Empty folders contain a `.gitkeep` so git tracks them; delete it once the folder has real files.

## Architecture notes

- `src/app.ts` defines the Express app (CORS, `/health`). `src/index.ts` wraps it in `http.createServer`, attaches a Socket.IO `Server` and listens. Port 4000 and the Socket.IO CORS origin (`http://localhost:3000`) are hardcoded.
- The backend compiles as CommonJS (no `"type": "module"` in `package.json`) to keep Jest simple, so relative imports have no file extension (`import { app } from "./app"`).
- TypeScript is pinned to 6 because ts-jest does not support TypeScript 7.
- `tsconfig.json` builds `src/` into `dist/` and is strict, including `noUncheckedIndexedAccess` (indexing an array gives `T | undefined`) and `exactOptionalPropertyTypes` (prefer `| null` over optional `?` fields in state).

## Coding standards (design doc, section 4.4)

- Code files are named with singular capitalized words, e.g. `Card.ts`, `Card.test.ts`. Entry points `index.ts` and `app.ts` are the exception.
- Database tables and columns use singular snake_case names (e.g. `table_players.seat_number`).
- Avoid the `any` type.
- Add comments where they clarify the code.
- Every test has a clearly defined purpose. When a bug is found, add a test for it to prevent regression.

## Git workflow

- Merge flow: feature branch → `develop` (1 approving PR review) → `main` (2 approving reviews). Nobody pushes directly to `develop` or `main`.
- Every PR must be approved by a teammate other than its author.
- Merging to `develop` requires 100% of unit tests passing and at least 80% code coverage (to be enforced by GitHub Actions CI).
- Feature branches are named by issue number and feature, e.g. `feature/13-login-page`.
- Commit messages contain the issue number, are short, and describe the change, e.g. `#3 init frontend and backend`.
