// Seeds a hand history for the leaderboard + badges demo, then checks the results through the real API.
// Run by scripts/leaderboard_demo.sh, which sets the environment:
//   node scripts/leaderboard_demo.mjs seed    creates the players and their hands (before the backend starts)
//   node scripts/leaderboard_demo.mjs check   prints the boards and badges, and checks them; exits 1 on a failure
//
// Needs: API_URL, ANON_KEY, SERVICE_ROLE_KEY (local Supabase), API (the backend), DEMO_PASSWORD.
// No packages: Node's own fetch only.

const { API_URL, ANON_KEY, SERVICE_ROLE_KEY, API, DEMO_PASSWORD } = process.env
for (const [name, value] of Object.entries({ API_URL, ANON_KEY, SERVICE_ROLE_KEY, API, DEMO_PASSWORD })) {
  if (!value) throw new Error(`${name} isn't set. Run this through scripts/leaderboard_demo.sh`)
}

// keep in step with shared/Rules.ts
const MIN_HANDS = { week: 5, month: 10, season: 20, all: 20 }
const DAY = 24 * 60 * 60 * 1000
const PLAYERS = ["Alice", "Bob", "Cara", "Dev", "Eve"]

/* ---------- periods (UTC, same rules as LeaderboardService.periodFor) ---------- */

const now = new Date()
const y = now.getUTCFullYear()
const m = now.getUTCMonth()
const thisWeek = new Date(Date.UTC(y, m, now.getUTCDate() - ((now.getUTCDay() + 6) % 7)))
const closed = {
  week: { from: new Date(thisWeek.getTime() - 7 * DAY), to: thisWeek },
  month: { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) },
  season: { from: new Date(Date.UTC(y, Math.floor(m / 3) * 3 - 3, 1)), to: new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1)) },
}

/* ---------- the story the data tells ----------
   Each block is a run of hands at one time; every number is that player's result in each hand.
   Top 3 in a finished period earn gold, silver, bronze (ties share a place):
   - Last season: Dev gold, Cara silver, Alice bronze.
   - Last month:  Cara gold, Alice silver, Dev bronze.
   - Last week:   Alice and Bob tie for gold, so there's no silver; Cara takes bronze.
                  Eve wins the most chips of anyone, but in only 2 hands, so she isn't ranked and gets nothing.
   - This week:   Bob is ahead, but the week hasn't ended, so no badge for it yet.
   - All-time:    live, not stored: whoever is top 3 right now (Cara, Alice, Bob).
   (Early in a month or quarter the periods overlap; the check works out the true places from the database either way.) */
const TABLE_NAME = "Badge Demo"
const SCRIPT = [
  { label: "last season", at: new Date(closed.season.from.getTime() + 15 * DAY), hands: 21, results: { Dev: 40, Cara: 10, Alice: -20, Bob: -30 } },
  { label: "last month", at: new Date(closed.month.from.getTime() + 3 * DAY), hands: 12, results: { Cara: 50, Alice: 5, Dev: -10, Bob: -20 } },
  { label: "last week", at: new Date(closed.week.from.getTime() + 1 * DAY), hands: 6, results: { Alice: 30, Bob: 30, Cara: -10, Dev: -40 } },
  { label: "last week", at: new Date(closed.week.from.getTime() + 2 * DAY), hands: 2, results: { Eve: 500, Dev: -500 } },
  { label: "this week", at: new Date(thisWeek.getTime() + (now.getTime() - thisWeek.getTime()) / 2), hands: 5, results: { Bob: 60, Cara: 20, Alice: -10 } },
]

/* ---------- HTTP helpers ---------- */

const admin = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" }

async function http(url, init = {}) {
  const res = await fetch(url, init)
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${url} → ${res.status}: ${text}`)
  return body
}

const rest = (path, init = {}) => http(`${API_URL}/rest/v1/${path}`, { ...init, headers: { ...admin, ...init.headers } })

async function userIds() {
  const rows = await rest(`user?select=id,username&username=in.(${PLAYERS.join(",")})`)
  return Object.fromEntries(rows.map((r) => [r.username, r.id]))
}

async function signIn(name) {
  const body = await http(`${API_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: `${name.toLowerCase()}@demo.local`, password: DEMO_PASSWORD }),
  })
  return body.access_token
}

/* ---------- seed ---------- */

async function seed() {
  for (const name of PLAYERS) {
    // a confirmed login; the sign-up trigger gives it a user row. Already existing is fine.
    await fetch(`${API_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: admin,
      body: JSON.stringify({ email: `${name.toLowerCase()}@demo.local`, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { username: name } }),
    })
  }
  const ids = await userIds()
  const missing = PLAYERS.filter((p) => !ids[p])
  if (missing.length) throw new Error(`No user row for ${missing.join(", ")}. Is the sign-up trigger in the migrations?`)

  const matches = []
  const seats = []
  let number = 0
  for (const block of SCRIPT) {
    const names = Object.keys(block.results)
    for (let i = 0; i < block.hands; i++) {
      const id = crypto.randomUUID()
      const at = new Date(block.at.getTime() + i * 60_000).toISOString() // a minute apart
      const winner = names.reduce((a, b) => (block.results[b] > block.results[a] ? b : a))
      const pot = names.reduce((sum, n) => sum + Math.max(0, block.results[n]), 0)
      matches.push({ id, table_name: "Leaderboard Demo", match_number: ++number, pot, winner_id: ids[winner], started_at: at, ended_at: at })
      names.forEach((n, seat) => seats.push({ match_id: id, seat_number: seat, user_id: ids[n], net_result: block.results[n] }))
    }
  }
  await rest("match", { method: "POST", body: JSON.stringify(matches) })
  await rest("match_players", { method: "POST", body: JSON.stringify(seats) })

  // a table with everyone seated, to see the badges on their avatars (like the seeded Dummy tables, it never deals)
  const [table] = await rest("table", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: TABLE_NAME, max_players: 6, buy_in: 100, status: 0, minimum_bet: 5, ante: 1, bot_count: 0 }),
  })
  await rest("table_players", {
    method: "POST",
    body: JSON.stringify(PLAYERS.map((p, seat) => ({ table_id: table.id, user_id: ids[p], seat_number: seat, stack: 1000 }))),
  })

  console.log(`  Seeded ${matches.length} hands for ${PLAYERS.join(", ")}:`)
  for (const b of SCRIPT) {
    const results = Object.entries(b.results).map(([n, r]) => `${n} ${r > 0 ? "+" : ""}${r}`).join(", ")
    console.log(`    ${b.label.padEnd(11)} ${b.at.toISOString().slice(0, 10)}  ${String(b.hands).padStart(2)} hands  (${results} per hand)`)
  }
}

/* ---------- check ---------- */

let failures = 0
function expect(ok, what) {
  console.log(`  ${ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"} ${what}`)
  if (!ok) failures++
}

const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" }

/* who should place 1st–3rd in [from, to), worked out straight from the database, independent of the backend.
   Ties share a place and push the next one down (1, 1, 3). */
function expectedPlaces(rows, from, to, minHands) {
  const totals = new Map()
  for (const r of rows) {
    const ended = new Date(r.match.ended_at)
    if ((from && ended < from) || ended >= to) continue
    const t = totals.get(r.user_id) ?? { userId: r.user_id, net: 0, won: 0, played: 0 }
    t.net += r.net_result
    t.won += r.net_result > 0 ? 1 : 0
    t.played += 1
    totals.set(r.user_id, t)
  }
  const ranked = [...totals.values()].filter((t) => t.played >= minHands)
  ranked.sort((a, b) => b.net - a.net || b.won - a.won || a.played - b.played)
  const placed = []
  ranked.forEach((t, i) => {
    const prev = ranked[i - 1]
    const place = prev && prev.net === t.net && prev.won === t.won && prev.played === t.played ? placed[i - 1].place : i + 1
    placed.push({ userId: t.userId, place })
  })
  return placed.filter((p) => p.place <= 3)
}

function printBoard(board, names) {
  console.log(`\n  \x1b[1m${board.label}\x1b[0m  (${board.totalRanked} ranked, ${board.minHands}+ hands to qualify)`)
  if (board.top.length === 0) console.log("    nobody ranked yet")
  for (const e of board.top) {
    const net = `${e.netWinnings > 0 ? "+" : e.netWinnings < 0 ? "-" : ""}$${Math.abs(e.netWinnings)}`
    console.log(`    #${String(e.rank).padEnd(3)} ${(names[e.userId] ?? e.username).padEnd(8)} ${net.padStart(7)}  ${String(e.handsPlayed).padStart(3)} hands`)
  }
}

const describe = (placed, names) => placed.map((p) => `${names[p.userId] ?? p.userId} ${MEDALS[p.place]}`).join(", ") || "nobody"

async function check() {
  const ids = await userIds()
  const names = Object.fromEntries(Object.entries(ids).map(([n, id]) => [id, n]))
  const tokens = Object.fromEntries(await Promise.all(PLAYERS.map(async (p) => [p, await signIn(p)])))

  console.log("\n\x1b[1mLeaderboards\x1b[0m (from GET /users/leaderboard)")
  const boards = {}
  for (const tf of ["week", "month", "season", "all"]) {
    boards[tf] = await http(`${API}/users/leaderboard?timeframe=${tf}`, { headers: { Authorization: `Bearer ${tokens.Alice}` } })
    printBoard(boards[tf], names)
  }

  console.log("\n\x1b[1mProfiles\x1b[0m (from GET /users/me, best badge first)")
  const profiles = {}
  for (const p of PLAYERS) {
    profiles[p] = await http(`${API}/users/me`, { headers: { Authorization: `Bearer ${tokens[p]}` } })
    const badges = profiles[p].badges.map((b) => `${MEDALS[b.place]} ${b.title} (${b.period})`).join("\n           ") || "no badges"
    console.log(`    ${p.padEnd(6)} ${badges}`)
  }

  const [demoTable] = await rest(`table?select=id&name=eq.${encodeURIComponent(TABLE_NAME)}`)
  const table = await http(`${API}/tables/${demoTable.id}`)
  console.log(`\n\x1b[1mSeat badges\x1b[0m (from GET /tables/:id, the one shown on each avatar)`)
  for (const seat of table.seats) {
    console.log(`    ${seat.username.padEnd(6)} ${seat.badge ? `${MEDALS[seat.badge.place]} ${seat.badge.title}` : "none"}`)
  }

  console.log("\n\x1b[1mChecks\x1b[0m")
  const history = await rest("match_players?select=user_id,net_result,match!inner(ended_at),user!inner(is_guest,role)&user.is_guest=eq.false&user.role=eq.0&match.ended_at=not.is.null")
  const stored = await rest("leaderboard_badge?select=user_id,timeframe,period_start,place")
  const key = (userId, tf, start, place) => `${userId}|${tf}|${new Date(start).toISOString()}|${place}`
  const storedKeys = new Set(stored.map((b) => key(b.user_id, b.timeframe, b.period_start, b.place)))

  const expectedKeys = new Set()
  for (const [tf, period] of Object.entries(closed)) {
    const placed = expectedPlaces(history, period.from, period.to, MIN_HANDS[tf])
    placed.forEach((p) => expectedKeys.add(key(p.userId, tf, period.from, p.place)))
    expect(placed.every((p) => storedKeys.has(key(p.userId, tf, period.from, p.place))), `last ${tf}'s top 3 got the right medals: ${describe(placed, names)}`)
  }
  const extra = [...storedKeys].filter((k) => !expectedKeys.has(k))
  expect(extra.length === 0, `no one else got a stored badge${extra.length ? ` (unexpected: ${extra.join("; ")})` : ""}`)

  const week = expectedPlaces(history, closed.week.from, closed.week.to, MIN_HANDS.week)
  expect(week.filter((p) => p.place === 1).length >= 2 && !week.some((p) => p.place === 2), "players tied for gold last week share it, and nobody gets silver")
  expect(profiles.Eve.badges.length === 0, "Eve won the most chips last week but played too few hands, so no badge")
  expect(!stored.some((b) => b.timeframe === "week" && new Date(b.period_start).getTime() === thisWeek.getTime()), "this week hasn't ended, so nobody has a badge for it yet")
  expect(boards.week.top[0] && names[boards.week.top[0].userId] === "Bob", "Bob leads the live board for this week")

  const live = expectedPlaces(history, null, new Date(), MIN_HANDS.all)
  const liveShown = PLAYERS.flatMap((p) => profiles[p].badges.filter((b) => b.timeframe === "all").map((b) => ({ userId: ids[p], place: b.place })))
  const sameLive = live.length === liveShown.length && live.every((e) => liveShown.some((s) => s.userId === e.userId && s.place === e.place))
  expect(sameLive, `the live all-time badges match the current all-time top 3: ${describe(live, names)}`)
  expect(!stored.some((b) => b.timeframe === "all"), "all-time badges are live, never stored")

  for (const p of PLAYERS) {
    const mine = stored.filter((b) => b.user_id === ids[p]).length + liveShown.filter((s) => s.userId === ids[p]).length
    const order = profiles[p].badges.map((b) => b.place)
    expect(profiles[p].badges.length === mine && order.every((pl, i) => i === 0 || order[i - 1] <= pl), `${p}'s profile shows all ${mine} badge(s), best place first`)
  }

  for (const seat of table.seats) {
    const best = profiles[names[seat.userId]]?.badges[0] ?? null
    expect(JSON.stringify(seat.badge ?? null) === JSON.stringify(best), `${seat.username}'s seat shows their best badge (${best ? best.title : "none"})`)
  }

  // loading again must not award anything twice
  await Promise.all(PLAYERS.map((p) => http(`${API}/users/me`, { headers: { Authorization: `Bearer ${tokens[p]}` } })))
  await http(`${API}/users/leaderboard`)
  const after = await rest("leaderboard_badge?select=user_id")
  expect(after.length === stored.length, `reloading doesn't duplicate badges (${stored.length} before, ${after.length} after)`)

  const anon = await http(`${API}/users/leaderboard`)
  expect(anon.me === null && Array.isArray(anon.top), "a signed-out visitor can see the leaderboard")
  expect(boards.week.me?.entry?.userId === ids.Alice, "a signed-in player gets their own standing")

  console.log(failures ? `\n\x1b[31m${failures} check(s) failed\x1b[0m` : "\n\x1b[32mAll checks passed\x1b[0m")
  console.log(`DEMO_TABLE_ID=${demoTable.id}`)
  process.exitCode = failures ? 1 : 0
}

const step = process.argv[2]
if (step === "seed") await seed()
else if (step === "check") await check()
else throw new Error("Usage: node scripts/leaderboard_demo.mjs seed|check")
