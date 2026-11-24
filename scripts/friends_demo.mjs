// Seeds players for the friends list demo, walks every friends flow through the real API, and checks each step.
// Run by scripts/friends_demo.sh, which sets the environment:
//   node scripts/friends_demo.mjs seed    creates the players, a table Bob sits at, and a few shared hands
//   node scripts/friends_demo.mjs check   runs the flows and checks them; exits 1 on a failure.
//                                         Then leaves the friends in a state worth looking at in the browser.
//
// Needs: API_URL, ANON_KEY, SERVICE_ROLE_KEY (local Supabase), API (the backend), DEMO_PASSWORD.
// No packages: Node's own fetch only.

const { API_URL, ANON_KEY, SERVICE_ROLE_KEY, API, DEMO_PASSWORD } = process.env
for (const [name, value] of Object.entries({ API_URL, ANON_KEY, SERVICE_ROLE_KEY, API, DEMO_PASSWORD })) {
  if (!value) throw new Error(`${name} isn't set. Run this through scripts/friends_demo.sh`)
}

const PLAYERS = ["Alice", "Bob", "Cara", "Dev", "Eve"]
const TABLE_NAME = "Friends Demo"
const email = (name) => `${name.toLowerCase()}@demo.local`

/* ---------- HTTP helpers ---------- */

const admin = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" }

async function rest(path, init = {}) {
  const res = await fetch(`${API_URL}/rest/v1/${path}`, { ...init, headers: { ...admin, ...init.headers } })
  const text = await res.text()
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

/* a backend call as a signed-in player; returns { status, body } and never throws on an error status */
async function api(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

async function signIn(name) {
  const res = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email(name), password: DEMO_PASSWORD }),
  })
  const body = await res.json()
  if (!body.access_token) throw new Error(`Couldn't sign in as ${name}: ${JSON.stringify(body)}`)
  return { token: body.access_token, id: body.user.id, name }
}

/* a fresh "Play as Guest" account, the same way the browser makes one */
async function signInAsGuest() {
  const res = await fetch(`${API_URL}/auth/v1/signup`, { method: "POST", headers: { apikey: ANON_KEY, "Content-Type": "application/json" }, body: "{}" })
  const body = await res.json()
  if (!body.access_token) throw new Error(`Couldn't make a guest: ${JSON.stringify(body)}`)
  const [row] = await rest(`user?id=eq.${body.user.id}&select=username`)
  return { token: body.access_token, id: body.user.id, name: row.username }
}

/* ---------- seed ---------- */

async function seed() {
  for (const name of PLAYERS) {
    // a confirmed login; the sign-up trigger gives it a user row and starting chips. Already existing is fine.
    await fetch(`${API_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: admin,
      body: JSON.stringify({ email: email(name), password: DEMO_PASSWORD, email_confirm: true, user_metadata: { username: name } }),
    })
  }
  const rows = await rest(`user?select=id,username&username=in.(${PLAYERS.join(",")})`)
  const ids = Object.fromEntries(rows.map((r) => [r.username, r.id]))
  const missing = PLAYERS.filter((p) => !ids[p])
  if (missing.length) throw new Error(`No user row for ${missing.join(", ")}. Is the sign-up trigger in the migrations?`)

  // Alice shared some hands with Cara and Eve, so they show up in her Recent players
  const hands = [
    { at: 90, players: ["Alice", "Eve"] },
    { at: 60, players: ["Alice", "Cara", "Eve"] },
    { at: 30, players: ["Alice", "Cara"] },
  ]
  const matches = []
  const seats = []
  hands.forEach((hand, i) => {
    const id = crypto.randomUUID()
    const at = new Date(Date.now() - hand.at * 60_000).toISOString()
    matches.push({ id, table_name: "Yesterday's Game", match_number: i + 1, pot: 20, winner_id: ids[hand.players[0]], started_at: at, ended_at: at })
    // created_at is when the hand was dealt, which is what "recent" goes by (the game writes these rows at the deal)
    hand.players.forEach((p, seat) => seats.push({ match_id: id, seat_number: seat, user_id: ids[p], net_result: seat === 0 ? 10 : -10, created_at: at }))
  })
  await rest("match", { method: "POST", body: JSON.stringify(matches) })
  await rest("match_players", { method: "POST", body: JSON.stringify(seats) })

  // Bob is sitting at a table, so his friends can join him
  const [table] = await rest("table", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: TABLE_NAME, max_players: 4, buy_in: 100, status: 0, minimum_bet: 5, ante: 1, bot_count: 0 }),
  })
  await rest("table_players", { method: "POST", body: JSON.stringify({ table_id: table.id, user_id: ids.Bob, seat_number: 0, stack: 1000 }) })

  console.log(`  ${PLAYERS.join(", ")} signed up (password ${DEMO_PASSWORD})`)
  console.log(`  Alice played ${hands.length} recent hands with Cara and Eve`)
  console.log(`  Bob is seated at "${TABLE_NAME}"`)
}

/* ---------- check ---------- */

let failures = 0
function expect(ok, what, detail) {
  console.log(`  ${ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"} ${what}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log(`       got: ${JSON.stringify(detail)}`)
  }
}
const step = (title) => console.log(`\n\x1b[1m${title}\x1b[0m`)
const names = (people) => people.map((p) => p.username).join(", ")

async function check() {
  const [alice, bob, cara, dev, eve] = await Promise.all(PLAYERS.map(signIn))
  const guest = await signInAsGuest()
  const [demoTable] = await rest(`table?select=id&name=eq.${encodeURIComponent(TABLE_NAME)}`)
  const list = async (who) => (await api("GET", "/friends", who.token)).body

  step("Starting out")
  let r = await api("GET", "/friends", alice.token)
  expect(r.status === 200 && r.body.friends.length + r.body.incoming.length + r.body.outgoing.length === 0, "Alice has no friends or requests yet", r.body)
  r = await api("GET", "/friends/recent", alice.token)
  expect(r.status === 200 && names(r.body) === "Cara, Eve", "Recent players: Cara and Eve, latest first", r.body)
  r = await api("GET", "/friends")
  expect(r.status === 401, "signed out, the friends list is refused (401)", r.status)

  step("Add: a request, then accept")
  r = await api("POST", "/friends", alice.token, { username: "bob" })
  expect(r.status === 201 && r.body.status === "requested" && r.body.player.username === "Bob", "Alice asks \"bob\" (any case): request sent (201)", r)
  r = await api("POST", "/friends", alice.token, { username: "Bob" })
  expect(r.status === 409 && r.body.code === "already_requested", "asking twice is refused (409 already_requested)", r)
  expect((await list(alice)).outgoing.map((x) => x.username).join() === "Bob", "Alice sees it under Sent")
  expect((await list(bob)).incoming.map((x) => x.username).join() === "Alice", "Bob sees it under Requests")
  r = await api("POST", `/friends/${alice.id}/accept`, bob.token)
  expect(r.status === 204, "Bob accepts (204)", r)
  expect(names((await list(alice)).friends) === "Bob" && names((await list(bob)).friends) === "Alice", "they're on each other's lists")
  r = await api("POST", "/friends", bob.token, { username: "Alice" })
  expect(r.status === 409 && r.body.code === "already_friends", "asking a friend again is refused (409 already_friends)", r)

  step("Add: asking back counts as yes")
  r = await api("POST", "/friends", cara.token, { username: "Alice" })
  expect(r.status === 201, "Cara asks Alice", r)
  r = await api("GET", "/friends/recent", alice.token)
  expect(names(r.body) === "Eve", "Cara leaves Alice's Recent players once there's a request", r.body)
  r = await api("POST", "/friends", alice.token, { username: "Cara" })
  expect(r.status === 200 && r.body.status === "accepted", "Alice asks Cara back: they're friends straight away (200 accepted)", r)

  step("Play together again")
  let friends = (await list(alice)).friends
  const bobRow = friends.find((f) => f.username === "Bob")
  expect(bobRow?.table?.id === demoTable.id && bobRow.table.name === TABLE_NAME, `Alice sees Bob is at "${TABLE_NAME}"`, bobRow)
  expect(names(friends) === "Bob, Cara" && friends[1].table === null, "seated friends come first; Cara is at no table", friends)
  r = await api("POST", `/tables/${bobRow.table.id}/players`, alice.token)
  expect(r.status < 300, "Alice joins Bob's table from the friends list", r)
  friends = (await list(bob)).friends
  expect(friends[0]?.table?.id === demoTable.id, "now Bob sees Alice at the same table", friends)
  r = await api("DELETE", `/tables/${demoTable.id}/players/me`, alice.token)
  expect(r.status < 300, "Alice leaves the table again", r)
  expect((await list(bob)).friends[0]?.table === null, "and Bob sees she's gone")

  step("Remove: unfriend, decline, cancel")
  r = await api("DELETE", `/friends/${bob.id}`, alice.token)
  expect(r.status === 204, "Alice removes Bob (204)", r)
  expect(names((await list(alice)).friends) === "Cara" && (await list(bob)).friends.length === 0, "Bob is off Alice's list, and she's off his")
  r = await api("DELETE", `/friends/${bob.id}`, alice.token)
  expect(r.status === 404 && r.body.code === "not_found", "removing again: 404 not_found", r)
  r = await api("POST", "/friends", dev.token, { username: "Alice" })
  r = await api("DELETE", `/friends/${dev.id}`, alice.token)
  expect(r.status === 204 && (await list(alice)).incoming.length === 0, "Alice declines Dev's request", r)
  r = await api("POST", `/friends/${dev.id}/accept`, alice.token)
  expect(r.status === 404 && r.body.code === "request_not_found", "a declined request can't be accepted (404)", r)
  r = await api("POST", "/friends", alice.token, { username: "Eve" })
  r = await api("DELETE", `/friends/${eve.id}`, alice.token)
  expect(r.status === 204 && (await list(eve)).incoming.length === 0, "Alice cancels her request to Eve before Eve sees it")
  r = await api("POST", "/friends", alice.token, { username: "Bob" })
  expect(r.status === 201, "after removing, Alice can ask Bob again", r)

  step("Refusals")
  r = await api("POST", "/friends", alice.token, { username: "Nobody" })
  expect(r.status === 404 && r.body.code === "user_not_found", "an unknown username (404)", r)
  r = await api("POST", "/friends", alice.token, { username: "Alice" })
  expect(r.status === 400 && r.body.code === "self", "yourself (400)", r)
  r = await api("POST", "/friends", alice.token, { username: "x" })
  expect(r.status === 400, "a username that's too short (400)", r)
  r = await api("POST", "/friends", alice.token, { username: guest.name })
  expect(r.status === 400 && r.body.code === "target_guest", `a guest (${guest.name}) can't be added (400)`, r)
  r = await api("POST", "/friends", guest.token, { username: "Alice" })
  expect(r.status === 403 && r.body.code === "guest", "a guest can't add anyone (403)", r)
  r = await api("DELETE", "/friends/not-a-real-id", alice.token)
  expect(r.status === 400, "a malformed player id never reaches the database (400)", r)
  const direct = await fetch(`${API_URL}/rest/v1/friendship?select=*`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${alice.token}` } })
  expect(direct.status === 401 || direct.status === 403, `the browser can't read the friendship table directly (${direct.status})`)

  step("Rate limit")
  let limited = null
  for (let i = 0; i < 25 && !limited; i++) {
    r = await api("POST", "/friends", dev.token, { username: "Nobody" })
    if (r.status === 429) limited = i
  }
  expect(limited !== null && limited <= 20, `Dev is stopped after 20 requests in 10 minutes (429 on request ${limited === null ? "never" : limited + 1})`)

  await browseState({ alice, bob, cara, dev })
  console.log(failures ? `\n\x1b[31m${failures} check(s) failed\x1b[0m` : "\n\x1b[32mAll checks passed\x1b[0m")
  console.log(`DEMO_TABLE_ID=${demoTable.id}`)
  process.exitCode = failures ? 1 : 0
}

/* Leaves the friendships with something on every tab, for looking around in the browser as Alice:
   friends with Bob (at a table, so there's a Join button) and Cara (not playing), a request from Dev
   waiting on her, and Eve in Recent players to add. */
async function browseState({ alice, bob, cara, dev }) {
  await rest(`friendship?or=(sender_id.eq.${alice.id},receiver_id.eq.${alice.id})`, { method: "DELETE" })
  await rest("friendship", {
    method: "POST",
    body: JSON.stringify([
      { sender_id: alice.id, receiver_id: bob.id, status: 1 },
      { sender_id: cara.id, receiver_id: alice.id, status: 1 },
      { sender_id: dev.id, receiver_id: alice.id, status: 0 },
    ]),
  })
  const shown = (await api("GET", "/friends", alice.token)).body
  step("Left for you to look at, as Alice")
  console.log(`    Friends:  ${shown.friends.map((f) => `${f.username}${f.table ? ` (at ${f.table.name})` : ""}`).join(", ")}`)
  console.log(`    Requests: ${names(shown.incoming)} wants to be friends`)
  console.log(`    Recent:   ${names((await api("GET", "/friends/recent", alice.token)).body)}`)
}

const command = process.argv[2]
if (command === "seed") await seed()
else if (command === "check") await check()
else throw new Error("Usage: node scripts/friends_demo.mjs seed|check")
