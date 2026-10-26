#!/usr/bin/env bash
# Starts the whole game for testing or a class demo, in one command:
# a local Supabase with clean seed data, two demo logins (Alice and Bob),
# the backend, the frontend, and an empty 2-player "Class Demo" table to join from the lobby.
#
# Usage: scripts/demo.sh [--keep-data]
#   --keep-data  keep the current local database instead of resetting it to the seed data
#
# Needs Docker running. Ctrl+C stops the servers (Supabase keeps running for next time).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$ROOT/.demo"
API_PORT=4000
WEB_PORT=3000
API="http://localhost:$API_PORT"
WEB="http://localhost:$WEB_PORT"
# Demo logins, created fresh each run (the seeded users have no passwords, so they can't sign in)
DEMO_PASSWORD="password123"

KEEP_DATA=false
[[ "${1:-}" == "--keep-data" ]] && KEEP_DATA=true

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }
supabase() { (cd "$BACKEND" && npx --yes supabase "$@"); }

# Waits until a URL answers, or gives up after 90 seconds
wait_for() {
  local url=$1 name=$2 log=$3
  for _ in $(seq 1 90); do
    curl -s -o /dev/null --max-time 5 "$url" && return 0
    sleep 1
  done
  fail "$name didn't start. See .demo/$log"
}

# 1. Checks
docker info >/dev/null 2>&1 || fail "Docker isn't running. Start Docker and try again."
for port in $API_PORT $WEB_PORT; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    fail "Port $port is already in use. Stop whatever is running there first."
  fi
done
for dir in "$BACKEND" "$FRONTEND"; do
  # Install when packages are missing or older than package-lock.json (e.g. after a pull)
  if [[ ! -f "$dir/node_modules/.package-lock.json" || "$dir/package-lock.json" -nt "$dir/node_modules/.package-lock.json" ]]; then
    say "Installing packages in ${dir#"$ROOT"/}..."
    (cd "$dir" && npm ci)
  fi
done

# 2. Database
say "Starting the local Supabase..."
supabase start >/dev/null
if ! $KEEP_DATA; then
  say "Resetting the database to the seed data..."
  supabase db reset >/dev/null
fi
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|STUDIO_URL)=')"

# Real environment variables win over .env files (dotenv and Next.js both skip ones already set),
# so the demo uses the local database without touching anyone's .env
export SUPABASE_URL="$API_URL" SUPABASE_SERVICE_KEY="$SERVICE_ROLE_KEY"
export FRONTEND_URL="$WEB" PORT="$API_PORT" NEXT_PUBLIC_API_URL="$API"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"

# Creates a confirmed login and prints its id. The sign-up trigger gives it a user row and starting chips.
# If the account already exists (--keep-data), it just looks the id up.
demo_account() {
  local name=$1 email=$2
  curl -s -o /dev/null -X POST "$API_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$DEMO_PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"username\":\"$name\"}}"
  curl -s "$API_URL/rest/v1/user?username=eq.$name&select=id" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" | sed -nE 's/.*"id":"([^"]+)".*/\1/p'
}
say "Creating the demo logins..."
ALICE_ID=$(demo_account Alice alice@demo.local)
BOB_ID=$(demo_account Bob bob@demo.local)
[[ -n "$ALICE_ID" && -n "$BOB_ID" ]] || fail "Couldn't create the demo logins. Is the sign-up trigger fix in backend/supabase/migrations?"

# 3. Servers
mkdir -p "$LOGS"
cleanup() {
  say "Stopping the servers..."
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
  echo "The local Supabase is still running. To stop it: cd backend && npx supabase stop"
}
trap cleanup EXIT

say "Starting the backend and frontend (logs in .demo/)..."
# The backend runs without "watch" so a saved file can't restart it and wipe the hand in progress
(cd "$BACKEND" && exec ./node_modules/.bin/tsx src/index.ts) >"$LOGS/backend.log" 2>&1 &
start_frontend() {
  (cd "$FRONTEND" && exec ./node_modules/.bin/next dev -p "$WEB_PORT") >>"$LOGS/frontend.log" 2>&1 &
  FRONTEND_PID=$!
}
: >"$LOGS/frontend.log"
start_frontend
wait_for "$API/tables" "The backend" backend.log
# Next.js sometimes exits on its first start to print an upgrade notice; start it once more if so
RESTARTED=false
for _ in $(seq 1 90); do
  curl -s -o /dev/null --max-time 5 "$WEB/" && break
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    $RESTARTED && fail "The frontend didn't start. See .demo/frontend.log"
    RESTARTED=true
    start_frontend
  fi
  sleep 1
done
wait_for "$WEB/" "The frontend" frontend.log

# 4. An empty demo table. Players join it from the lobby; the hand deals once two are seated.
say "Creating the demo table..."
TABLE_ID=$(curl -sf -X POST "$API/tables" -H "Content-Type: application/json" \
  -d "{\"name\":\"Class Demo\",\"maxPlayers\":2,\"buyIn\":100,\"minimumBet\":2,\"ante\":1,\"hostId\":\"$ALICE_ID\"}" |
  sed -E 's/.*"id":"([^"]+)".*/\1/') || fail "Couldn't create the demo table. See .demo/backend.log"
# Compile the pages now so they open fast during the demo
for page in / /dashboard "/table/$TABLE_ID"; do curl -s -o /dev/null --max-time 60 "$WEB$page"; done

say "Ready!"
cat <<EOF
  Sign in:   $WEB
  Database:  $STUDIO_URL  (Supabase Studio)

  Logins:    alice@demo.local / $DEMO_PASSWORD
             bob@demo.local   / $DEMO_PASSWORD
             or "Play as Guest"

  1. Normal window: sign in as Alice. You land in the lobby; join "Class Demo".
  2. Private/incognito window (logins are shared between tabs of the same window):
     sign in as Bob, or play as a guest, and join "Class Demo".
  3. The first hand deals as soon as both players are seated. Act in whichever window says "Your turn".
  (Skip the seeded "Dummy" tables: their players were added straight to the database, so they never deal.)

  Press Ctrl+C to stop.
EOF
wait
