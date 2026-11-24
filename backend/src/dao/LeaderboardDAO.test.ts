import { getLeaderboardStats } from "./LeaderboardDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

const from = new Date("2026-11-23T00:00:00Z")
const to = new Date("2026-11-30T00:00:00Z")

describe("LeaderboardDAO", () => {
  it("asks the database for each player's balance and totals in the window", async () => {
    mockState.result = {
      data: [{ user_id: "u1", username: "Maya", avatar_url: null, balance: 1800, hands_played: 6, hands_won: 4, net_winnings: "350" }],
    }
    expect(await getLeaderboardStats(from, to)).toEqual([
      { userId: "u1", username: "Maya", avatarUrl: null, balance: 1800, handsPlayed: 6, handsWon: 4, netWinnings: 350 },
    ])
    expect(calls).toContainEqual(["rpc", ["leaderboard_stats", { p_from: "2026-11-23T00:00:00.000Z", p_to: "2026-11-30T00:00:00.000Z" }]])
  })

  it("has no start date for all time", async () => {
    mockState.result = { data: [] }
    await getLeaderboardStats(null, to)
    expect(calls).toContainEqual(["rpc", ["leaderboard_stats", { p_from: null, p_to: "2026-11-30T00:00:00.000Z" }]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getLeaderboardStats(from, to)).rejects.toThrow("db down")
  })
})
