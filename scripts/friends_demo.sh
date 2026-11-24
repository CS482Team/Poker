#!/usr/bin/env bash
# Tries out the friends list end to end against a local Supabase: resets the database, signs up five players
# (Alice, Bob, Cara, Dev, Eve), seats Bob at a table and gives Alice a few hands with Cara and Eve, starts the
# backend, then walks every flow through the real API and checks each step: requests, accepting (and asking back),
# joining a friend's table, removing, declining, cancelling, the refusals and the rate limit.
# Then it starts the frontend so you can look at /friends yourself.
#
# Usage: [API_PORT=4100 WEB_PORT=3100] scripts/friends_demo.sh [--check-only]
#   --check-only  run the checks and stop (no frontend); exits 1 if any check fails
#
# Resets your local database to the seed data. Needs Docker running. Ctrl+C stops the servers.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$ROOT/.demo"
# override if you already have the app running, e.g. API_PORT=4100 WEB_PORT=3100 scripts/friends_demo.sh
API_PORT=${API_PORT:-4000}
WEB_PORT=${WEB_PORT:-3000}
WEB="http://localhost:$WEB_PORT"
export API="http://localhost:$API_PORT"
export DEMO_PASSWORD="password123"

CHECK_ONLY=false
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=true

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }
supabase() { (cd "$BACKEND" && npx --yes supabase "$@"); }

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
ports=$API_PORT; $CHECK_ONLY || ports="$API_PORT $WEB_PORT"
for port in $ports; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    fail "Port $port is already in use. Stop whatever is running there first."
  fi
done
for dir in "$BACKEND" "$FRONTEND"; do
  if [[ ! -f "$dir/node_modules/.package-lock.json" || "$dir/package-lock.json" -nt "$dir/node_modules/.package-lock.json" ]]; then
    say "Installing packages in ${dir#"$ROOT"/}..."
    (cd "$dir" && npm ci)
  fi
done

# 2. Database: a clean reset applies every migration, including the friends list one
say "Starting the local Supabase..."
supabase start >/dev/null
say "Resetting the database to the seed data..."
supabase db reset >/dev/null
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|STUDIO_URL)=')"
export API_URL ANON_KEY SERVICE_ROLE_KEY
export SUPABASE_URL="$API_URL" SUPABASE_SERVICE_KEY="$SERVICE_ROLE_KEY"
export FRONTEND_URL="$WEB" PORT="$API_PORT" NEXT_PUBLIC_API_URL="$API"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"

say "Seeding players..."
node "$ROOT/scripts/friends_demo.mjs" seed

# 3. Backend, then the checks
mkdir -p "$LOGS"
cleanup() {
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT

say "Starting the backend (log in .demo/backend.log)..."
(cd "$BACKEND" && exec ./node_modules/.bin/tsx src/index.ts) >"$LOGS/backend.log" 2>&1 &
wait_for "$API/tables" "The backend" backend.log

STATUS=0
CHECK_OUT="$LOGS/check.log"
node "$ROOT/scripts/friends_demo.mjs" check | tee "$CHECK_OUT" | grep -v '^DEMO_TABLE_ID=' || STATUS=$?
TABLE_ID=$(sed -nE 's/^DEMO_TABLE_ID=(.*)/\1/p' "$CHECK_OUT")
$CHECK_ONLY && exit $STATUS

# 4. Frontend, to look around
say "Starting the frontend (log in .demo/frontend.log)..."
start_frontend() {
  (cd "$FRONTEND" && exec ./node_modules/.bin/next dev -p "$WEB_PORT") >>"$LOGS/frontend.log" 2>&1 &
  FRONTEND_PID=$!
}
: >"$LOGS/frontend.log"
start_frontend
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
for page in / /dashboard /friends "/table/$TABLE_ID"; do curl -s -o /dev/null --max-time 60 "$WEB$page"; done

say "Ready!"
cat <<EOF
  Sign in at $WEB as alice@demo.local (password: $DEMO_PASSWORD), then open Friends from the
  profile menu at the top right (the red dot is Dev's request):
    Friends tab    Bob is at "Friends Demo": press Join to sit with him. Cara isn't playing. Try Remove.
    Requests tab   accept or decline Dev
    Recent players Eve, from your recent hands: press Add
  Other logins, all with the same password: bob@, cara@, dev@, eve@demo.local
  To see a request arrive, sign in as another player in a private window and add "Alice".

  Database: $STUDIO_URL  (see the friendship table)

  Press Ctrl+C to stop.
EOF
wait
