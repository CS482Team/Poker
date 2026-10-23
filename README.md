# Poker

Hearts & Diamonds: a multiplayer five-card draw poker web app (CS482). Next.js frontend, Express + Socket.IO backend, Supabase database.

## Setup

Requires Node.js 20+.

```bash
cd frontend && npm install
cd ../backend && npm install
```

Copy .env templates and fill in values:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

`backend/.env` needs `SUPABASE_URL` (ending at `.supabase.co`, no `/rest/v1/`) and `SUPABASE_SERVICE_KEY`. Never commit `.env` files.

## Run

Two terminals:

```bash
cd frontend && npm run dev # http://localhost:3000
cd backend && npm run dev  # http://localhost:4000
```

Open http://localhost:3000/table, click **Deal**, and play a betting round. Until sign-in exists, the **Viewing as** / **Follow turn** controls in the header let one browser play every seat.

## Test

```bash
cd backend && npm test             # or: npm run test:coverage
cd frontend && npm test            # or: npm run test:coverage
```

Coverage must stay at 80% or above (statements, branches, functions, lines); `test:coverage` fails below that, and CI runs it on every pull request.

## Game rules (implemented so far)

- **Five-card draw with antes.** Every player in the hand pays the table's ante, then gets 5 cards (S1).
- **No-limit betting** (S2). On your turn: fold, check (if nobody has bet), call, or bet/raise any amount from the minimum up to your whole stack.
  - Minimum bet: the table's `minimum_bet` (at least 1). Minimum raise: the size of the last full bet or raise.
  - Amounts are "to" amounts: *Raise to 30* means your total bet this round becomes 30.
  - A short all-in still has to be matched, but doesn't let players who already acted raise again.
- **Hand flow:** pre-draw betting → draw (S3) → post-draw betting → showdown (S4). If everyone else folds, the hand goes straight to showdown.

## Game API (backend)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/game` | `{ seats?: [{ id, name, stack }] }` (demo bots if omitted) | `{ gameId, matchId }` |
| `GET` | `/game/:gameId/view/:playerId` | | that player's view: their own cards, pot, whose turn, `legalActions` |
| `POST` | `/game/:gameId/action` | `{ playerId, action: { type, amount? } }` | the player's updated view |
| `POST` | `/demo/deal` | | demo only: deals and returns every hand |

`type` is `fold`, `check`, `call`, `bet` or `raise`; `amount` (bet/raise only) is the total to bet this round. Errors come back as `{ error }`: 400 invalid or illegal action, 404 unknown game or player, 409 not your turn or wrong phase.

Live games are kept in memory (`backend/src/services/GameStore.ts`) and lost on restart; each deal also saves a `match` row and `match_players` rows to Supabase.

## Code layout

See `.github/agents/poker-dev.agent.md` for the full layout and layer rules. In short:

- `backend/src/game/`: the pure poker engine (Card, Deck, Dealer, Turn, Betting): no database or network code
- `backend/src/services/`: combines the engine with the database and the game store
- `backend/src/dao/`: the only code that talks to Supabase
- `backend/src/controller/` + `route/`: the REST API
- `frontend/src/view/Table.tsx`: the game room; `component/` for its pieces; `service/Game.ts` for backend calls
