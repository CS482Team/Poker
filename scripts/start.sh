#!/usr/bin/env bash
cd "$(dirname "$0")/.."

docker info >/dev/null 2>&1 || docker desktop start

(cd backend && npx supabase start)

trap 'kill 0' EXIT
(cd backend && npm run dev) &
(cd frontend && npm run dev) &
wait
