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

## Demo

One command starts everything for testing or a class demo: the local database (reset to the seed data), the backend, the frontend, and an empty 2-player "Class Demo" table.

```bash
scripts/demo.sh              # add --keep-data to skip the database reset
```

It needs Docker running and ports 3000 and 4000 free. It uses the local database even if your `.env` files point at the hosted one, and doesn't change them.

When it prints **Ready**:

1. Open http://localhost:3000 in two browser tabs. In the second tab, switch to User 2 (Theo) in the top-right menu.
2. Join "Class Demo" from the lobby in both tabs. The first hand deals as soon as both players are seated.
3. Play in whichever tab says "Your turn". After each showdown the next hand deals itself 5 seconds later.

Skip the seeded "Dummy" tables: their players are added straight to the database, so they never deal a hand.

Ctrl+C stops the servers. Logs are in `.demo/`. The database keeps running; stop it with `cd backend && npx supabase stop`.

## Test

CI requires 80% coverage.

```bash
cd backend && npm test             # or: npm run test:coverage
cd frontend && npm test            # or: npm run test:coverage
```

## Implemented

- List of tables shown live as people create, join and leave them
- Betting, the draw, a second betting round, and showdown done

#### Details
- The winner is shown at rounds end, and the next hand is dealt a few seconds later
- Leaving mid-hand folds you and cashes out the chips you have left
- The game ends when only one player can still play
- Table is deleted when the last player leaves

## TODO
- User accounts and sign in
- Games still only exist in memory
- Players with no chips still stay seated
- Need to show the name of the winning hand
