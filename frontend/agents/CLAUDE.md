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

The team works test-first (TDD): write a failing test, make it pass with the smallest change, then refactor. Testing Library + jsdom are installed, but there is no Jest config or `test` script yet.

## Environment

Copy `.env.example` to `.env` (gitignored) and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`)

Only `NEXT_PUBLIC_*` variables reach the browser. Never put the Supabase service key in the frontend.

## Architecture notes

- Code lives in `app/` (`layout.tsx`, `page.tsx`, `globals.css`). The `@/*` path alias maps to `frontend/`.
- Tailwind v4 is loaded via `@import "tailwindcss"` in `globals.css` and the `@tailwindcss/turbopack` loader in `next.config.ts` (no `tailwind.config` or PostCSS config).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Next 16 has APIs and conventions that differ from older versions (e.g. the global `LayoutProps<"/">` type used in `layout.tsx`); check the Next 16 docs before assuming older patterns.

## Git workflow

- `main` is the default branch; integration happens on `develop`.
- Feature branches are named `feature/<issue#>-<slug>` (e.g. `feature/3-initialize-the-project`) and merged into `develop` via PR.
- Commit messages are prefixed with the issue number, e.g. `#3 init frontend and backend`.
