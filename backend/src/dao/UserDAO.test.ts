import { getAllPlayers, getBalance, getDailyReward, getRankableBalance, getRole, getUserIdFromToken, getUsername, recordDailyClaim, removeUser, setBalance, unbanUser } from "../dao/UserDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("UserDAO", () => {
  it("reads a balance", async () => {
    mockState.result = { data: { chip_balance: 500 } }
    expect(await getBalance("u1")).toBe(500)
    expect(calls).toContainEqual(["from", ["user"]])
  })

  it("reads a username", async () => {
    mockState.result = { data: { username: "Maya" } }
    expect(await getUsername("u1")).toBe("Maya")
    expect(calls).toContainEqual(["select", ["username"]])
    expect(calls).toContainEqual(["eq", ["id", "u1"]])
  })

  it("reads a username", async () => {
    mockState.result = { data: { username: "Maya" } }
    expect(await getUsername("u1")).toBe("Maya")
    expect(calls).toContainEqual(["select", ["username"]])
    expect(calls).toContainEqual(["eq", ["id", "u1"]])
  })

  it("saves the new balance on the user", async () => {
    await setBalance("u1", 400)
    expect(calls).toContainEqual(["from", ["user"]])
    expect(calls).toContainEqual(["update", [{ chip_balance: 400 }]])
    expect(calls).toContainEqual(["eq", ["id", "u1"]])
  })

  it("lists players with their hand counts", async () => {
    mockState.result = { data: [{ id: "u1", username: "Maya", chip_balance: 500, banned: false, match_players: [{ count: 3 }] }] }
    expect(await getAllPlayers()).toEqual([{ id: "u1", username: "Maya", balance: 500, handsPlayed: 3, banned: false }])
    expect(calls).toContainEqual(["eq", ["role", 0]])
  })

  it("reads a role", async () => {
    mockState.result = { data: { role: 1 } }
    expect(await getRole("u1")).toBe(1)
  })

  it("finds the user for a token", async () => {
    mockState.result = { data: { user: { id: "u1" } } }
    expect(await getUserIdFromToken("token")).toBe("u1")
  })

  it("returns null for a banned user", async () => {
    mockState.result = { data: { user: { id: "u1", banned_until: "2999-01-01" } } }
    expect(await getUserIdFromToken("token")).toBeNull()
  })

  it("removes a user", async () => {
    await removeUser("u1")
    expect(calls).toContainEqual(["updateUserById", ["u1", { ban_duration: "876000h" }]])
    expect(calls).toContainEqual(["update", [{ banned: true }]])
  })

  it("unbans a user", async () => {
    await unbanUser("u1")
    expect(calls).toContainEqual(["updateUserById", ["u1", { ban_duration: "none" }]])
    expect(calls).toContainEqual(["update", [{ banned: false }]])
  })

  it("returns null for a bad token", async () => {
    mockState.result = { data: { user: null } }
    expect(await getUserIdFromToken("bad")).toBeNull()
  })

  it("reads the daily reward streak", async () => {
    mockState.result = { data: { last_daily_reward_at: "2026-11-20", current_streak: 3 } }
    expect(await getDailyReward("u1")).toEqual({ lastClaimAt: "2026-11-20", streak: 3 })
  })

  it("records a daily claim only once", async () => {
    mockState.result = { data: [{ id: "u1" }] }
    expect(await recordDailyClaim("u1", null, new Date("2026-11-20"), 1)).toBe(true)
    expect(calls).toContainEqual(["is", ["last_daily_reward_at", null]])
    mockState.result = { data: [] }
    expect(await recordDailyClaim("u1", "2026-11-19", new Date("2026-11-20"), 2)).toBe(false)
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getBalance("u1")).rejects.toThrow("db down")
    await expect(setBalance("u1", 400)).rejects.toThrow("db down")
    await expect(getRole("u1")).rejects.toThrow("db down")
    await expect(getAllPlayers()).rejects.toThrow("db down")
    await expect(getUsername("u1")).rejects.toThrow("db down")
    await expect(removeUser("u1")).rejects.toThrow("db down")
  })

  describe("getRankableBalance", () => {
    it("reads a signed-up player's balance", async () => {
      mockState.result = { data: { chip_balance: 1800, is_guest: false, role: 0 } }
      expect(await getRankableBalance("u1")).toBe(1800)
      expect(calls).toContainEqual(["eq", ["id", "u1"]])
    })

    it("doesn't rank guests, admins or missing users", async () => {
      mockState.result = { data: { chip_balance: 900, is_guest: true, role: 0 } }
      expect(await getRankableBalance("g1")).toBeNull()
      mockState.result = { data: { chip_balance: 900, is_guest: false, role: 1 } }
      expect(await getRankableBalance("a1")).toBeNull()
      mockState.result = { data: null }
      expect(await getRankableBalance("nobody")).toBeNull()
    })

    it("throws when the database fails", async () => {
      mockState.result = failure
      await expect(getRankableBalance("u1")).rejects.toThrow("db down")
    })
  })
})
