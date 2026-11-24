import { acceptRequest, deleteFriendship, findPlayerByUsername, getFriendship, getFriendships, getRecentOpponents, getSeatedTables, insertRequest } from "../dao/FriendDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const ME = "00000000-0000-0000-0000-000000000001"
const THEO = "00000000-0000-0000-0000-000000000002"

beforeEach(resetMock)

describe("findPlayerByUsername", () => {
  it("finds a player whatever the case, escaping wildcards", async () => {
    mockState.awaited = { data: [{ id: THEO, username: "Theo", avatar_url: null, is_guest: false }] }
    expect(await findPlayerByUsername("theo")).toEqual({ id: THEO, username: "Theo", avatarUrl: null, isGuest: false })
    expect(calls).toContainEqual(["ilike", ["username", "theo"]])
    await findPlayerByUsername("a_b%c")
    expect(calls).toContainEqual(["ilike", ["username", "a\\_b\\%c"]])
  })

  it("prefers the exact name when two only differ by case", async () => {
    mockState.awaited = { data: [{ id: "x", username: "THEO", avatar_url: null, is_guest: false }, { id: THEO, username: "Theo", avatar_url: null, is_guest: false }] }
    expect((await findPlayerByUsername("Theo"))?.id).toBe(THEO)
    // and won't guess between them otherwise
    expect(await findPlayerByUsername("theo")).toBeNull()
  })

  it("returns null when nobody has that name", async () => {
    mockState.awaited = { data: [] }
    expect(await findPlayerByUsername("nobody")).toBeNull()
  })
})

describe("friendships", () => {
  it("lists every row the player is in, from either side", async () => {
    mockState.awaited = { data: [{ sender_id: ME, receiver_id: THEO, status: 1 }] }
    expect(await getFriendships(ME)).toHaveLength(1)
    expect(calls).toContainEqual(["or", [`sender_id.eq.${ME},receiver_id.eq.${ME}`]])
  })

  it("finds the row between two players in either direction", async () => {
    mockState.result = { data: { sender_id: THEO, status: 0 } }
    expect(await getFriendship(ME, THEO)).toEqual({ senderId: THEO, status: 0 })
    expect(calls).toContainEqual(["or", [`and(sender_id.eq.${ME},receiver_id.eq.${THEO}),and(sender_id.eq.${THEO},receiver_id.eq.${ME})`]])
    mockState.result = { data: null }
    expect(await getFriendship(ME, THEO)).toBeNull()
  })

  it("sends a pending request, or says one already exists", async () => {
    mockState.awaited = { error: null }
    expect(await insertRequest(ME, THEO)).toBe(true)
    expect(calls).toContainEqual(["insert", [{ sender_id: ME, receiver_id: THEO, status: 0 }]])
    mockState.awaited = { error: { code: "23505" } }
    expect(await insertRequest(ME, THEO)).toBe(false)
  })

  it("accepts only a pending request from that sender", async () => {
    mockState.awaited = { data: [{ id: "f1" }] }
    expect(await acceptRequest(THEO, ME)).toBe(true)
    expect(calls).toContainEqual(["update", [{ status: 1 }]])
    expect(calls).toContainEqual(["eq", ["sender_id", THEO]])
    expect(calls).toContainEqual(["eq", ["receiver_id", ME]])
    expect(calls).toContainEqual(["eq", ["status", 0]])
    mockState.awaited = { data: [] }
    expect(await acceptRequest(THEO, ME)).toBe(false)
  })

  it("deletes the row between two players", async () => {
    mockState.awaited = { data: [{ id: "f1" }] }
    expect(await deleteFriendship(ME, THEO)).toBe(true)
    expect(calls).toContainEqual(["delete", []])
    mockState.awaited = { data: [] }
    expect(await deleteFriendship(ME, THEO)).toBe(false)
  })
})

describe("getSeatedTables", () => {
  it("maps each player to the table they're at", async () => {
    mockState.awaited = { data: [{ user_id: THEO, table: { id: "t1", name: "Velvet Room" } }, { user_id: "gone", table: null }] }
    expect(await getSeatedTables([THEO, "gone"])).toEqual(new Map([[THEO, { id: "t1", name: "Velvet Room" }]]))
    expect(calls).toContainEqual(["in", ["user_id", [THEO, "gone"]]])
  })

  it("doesn't query for nobody", async () => {
    expect(await getSeatedTables([])).toEqual(new Map())
    expect(calls).toHaveLength(0)
  })
})

describe("getRecentOpponents", () => {
  it("finds the signed-up players from the player's latest hands", async () => {
    // both queries resolve to the same mocked data, which is fine for checking the shape and the filters
    mockState.awaited = { data: [{ match_id: "m1", created_at: "2026-11-23T10:00:00Z", user: { id: THEO, username: "Theo", avatar_url: null } }] }
    expect(await getRecentOpponents(ME, 30)).toEqual([{ id: THEO, username: "Theo", avatar_url: null, played_at: "2026-11-23T10:00:00Z" }])
    expect(calls).toContainEqual(["limit", [30]])
    expect(calls).toContainEqual(["in", ["match_id", ["m1"]]])
    expect(calls).toContainEqual(["neq", ["user_id", ME]])
    expect(calls).toContainEqual(["eq", ["user.is_guest", false]])
  })

  it("stops early when the player hasn't played", async () => {
    mockState.awaited = { data: [] }
    expect(await getRecentOpponents(ME, 30)).toEqual([])
    expect(calls.filter(([name]) => name === "from")).toHaveLength(1)
  })
})

it("throws when the database fails", async () => {
  mockState.result = failure
  await expect(findPlayerByUsername("Theo")).rejects.toThrow("db down")
  await expect(getFriendships(ME)).rejects.toThrow("db down")
  await expect(getFriendship(ME, THEO)).rejects.toThrow("db down")
  await expect(insertRequest(ME, THEO)).rejects.toThrow("db down")
  await expect(acceptRequest(THEO, ME)).rejects.toThrow("db down")
  await expect(deleteFriendship(ME, THEO)).rejects.toThrow("db down")
  await expect(getSeatedTables([THEO])).rejects.toThrow("db down")
  await expect(getRecentOpponents(ME, 30)).rejects.toThrow("db down")
})
