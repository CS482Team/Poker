# Poker

## Setup

Requires Node.js 20+ and [Docker](https://docs.docker.com/desktop/) (keep it open).

```bash
cd frontend && npm install
cd ../backend && npm install
npx supabase start     # prints the URL and keys for your .env files
npx supabase db reset  # loads test data
```

Copy .env templates and fill in values:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

## Run

Three terminals:

```bash
cd frontend && npm run dev # http://localhost:3000
cd backend && npm run dev  # http://localhost:4000
cd backend && npx supabase start # http://127.0.0.1:54323
```
