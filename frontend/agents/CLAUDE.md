# Frontend: CLAUDE.md

Guidance for Claude Code when working in `frontend/`.

## Overview

Frontend for a multiplayer five-card draw poker web app (CS482 team project, GitHub org `CS482Team`). Rules: antes, fixed-limit betting (small bet before the draw, big bet after).

- Next.js 16 (App Router) + React 19 + Tailwind CSS v4, TypeScript. Port 3000.
- Talks to the backend (`backend/`, Express + Socket.IO on port 4000) over Socket.IO; `socket.io-client` is installed but not yet used.
- Supabase (`@supabase/supabase-js`) is installed but not yet used.
- `backend/` is a separate npm package; there is no root `package.json` or workspace setup, so the frontend cannot import backend code.

## Commands

Requires Node.js 20+. Run everything from `frontend/`, after `npm install`.

- `npm run dev`: dev server at http://localhost:3000 (Turbopack)
- `npm run build` / `npm start`
- `npm run lint`: ESLint (flat config extending `eslint-config-next` core-web-vitals + typescript)

## Testing

The team works test-first (TDD): write a failing test, make it pass with the smallest change, then refactor. Components are tested with Jest + React Testing Library (jsdom). These are installed, but there is no Jest config or `test` script yet.

## Environment

Copy `.env.example` to `.env` (gitignored) and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`)

Only `NEXT_PUBLIC_*` variables reach the browser. Never put the Supabase service key in the frontend.

## Folder structure

```
src/
  app/         Next.js App Router routes (page.tsx, layout.tsx, globals.css); keep these thin
  asset/       images, card art, sounds
  component/   reusable UI components (e.g. a card, a chip stack, a button)
  context/     React context providers (e.g. auth session, socket connection)
  service/     talking to the outside world: Socket.IO client, REST calls to the backend, Supabase
  util/        small shared helpers
  view/        page-level screens (lobby, game room, profile) that routes in app/ render
```

- The `@/*` path alias maps to `src/`, e.g. `import { Card } from "@/component/Card"`.
- Empty folders contain a `.gitkeep` so git tracks them; delete it once the folder has real files.
- Design: a mature red theme across all pages; the game room shows the table as a red oval (design doc, section 4.6). The site must work on mobile.

## Architecture notes

- Next.js finds routes in `src/app/` automatically (there is no root `app/` folder).
- Tailwind v4 is loaded via `@import "tailwindcss"` in `globals.css` and the `@tailwindcss/turbopack` loader in `next.config.ts` (no `tailwind.config` or PostCSS config).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Next 16 has APIs and conventions that differ from older versions (e.g. the global `LayoutProps<"/">` type used in `layout.tsx`); check the Next 16 docs before assuming older patterns.

## Coding standards (design doc, section 4.4)

- Code files are named with singular capitalized words, e.g. `Card.tsx`, `GameRoom.tsx`. Next.js special files in `src/app/` (`page.tsx`, `layout.tsx`, `globals.css`) must keep their lowercase names.
- Avoid the `any` type.
- Add comments where they clarify the code.
- Every test has a clearly defined purpose. When a bug is found, add a test for it to prevent regression.

## Git workflow

- Merge flow: feature branch → `develop` (1 approving PR review) → `main` (2 approving reviews). Nobody pushes directly to `develop` or `main`.
- Every PR must be approved by a teammate other than its author.
- Merging to `develop` requires 100% of unit tests passing and at least 80% code coverage (to be enforced by GitHub Actions CI).
- Feature branches are named by issue number and feature, e.g. `feature/13-login-page`.
- Commit messages contain the issue number, are short, and describe the change, e.g. `#3 init frontend and backend`.
