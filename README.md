# Poker

Multiplayer five-card draw poker. Next.js frontend, Express + Socket.IO backend, Supabase database.

## Setup

Need Node.js 20+ and [Docker](https://docs.docker.com/desktop/) running in the background.

```bash
cd frontend && npm install
cd ../backend && npm install
npx supabase start     # starts the local database and prints its URL and keys
npx supabase db reset  # rebuilds the schema and loads the test data
```

Then copy the env templates:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

and fill them in from what `supabase start` printed:

- `backend/.env`: `SUPABASE_URL` is the API URL, `SUPABASE_SERVICE_KEY` is the service role key, `FRONTEND_URL=http://localhost:3000`, `PORT=4000`
- `frontend/.env`: `NEXT_PUBLIC_SUPABASE_URL` is the API URL, `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key
- The local database UI is at http://127.0.0.1:54323
- `npx supabase db reset` puts everything back to the seed data

## Run

Two terminals:

```bash
cd frontend && npm run dev # http://localhost:3000
cd backend && npm run dev  # http://localhost:4000
```

## Test

CI requires 80% coverage.

```bash
cd backend && npm test             # or: npm run test:coverage
cd frontend && npm test            # or: npm run test:coverage
```

## Implemented

- The lobby has a list of tables updated live as people create, join and leave them
- Joining a table takes the buy-in from your balance, and leaving pays your stack back
- A table is deleted when the last player leaves
- Once two players are seated, everyone antes and gets five cards
- The first betting round is playable: fold, check, call, or bet/raise

## TODO
- The draw phase, the second betting round, showdown, and sign-in
- Until sign-in exists, use the user switch in the nav bar to play as each test user
