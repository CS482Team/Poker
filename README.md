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

Starts everything for testing or demo. Uses local database with seed data.

```bash
scripts/demo.sh # starts servers, runs install, supabase reset and docker init, frontend and backend
```

It needs Docker running in background and ports 3000 and 4000 free. It uses local database even if `.env` files point at hosted one.
Stop database with `cd backend && npx supabase stop`.

## Test

CI requires 80% coverage.

```bash
cd backend && npm test             # or: npm run test:coverage
cd frontend && npm test            # or: npm run test:coverage
```

## Implemented
- Create accounts and log in as user or guest
- List of tables shown live as people create, join and leave them
- Betting, the draw, a second betting round, and showdown done

### Details

#### Accounts
- Users can create and log into their accounts, but accounts and auth are not wired to any other parts
- Dev toggle still exists to allow simulating actions from different users

#### Gameplay
- The winner is shown at round end, and the next hand is dealt a few seconds later
- Leaving mid-hand folds you and cashes out the chips you have left
- The game ends if only one player remains in room and it is deleted when last player leaves

## TODO 
- Connect user accounts to tables and gameplay
- Players with no chips should spectate instead of stay seated
