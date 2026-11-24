import { fetchLeaderboard } from "@/service/LeaderboardService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(ok: boolean, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

describe("LeaderboardService", () => {
  it("fetches the timeframe's leaderboard with the session token, so the player gets their own rank", async () => {
    const board = { top: [{ rank: 1, userId: "u1", username: "Maya", balance: 900 }], me: null }
    respond(true, board)
    expect(await fetchLeaderboard("month")).toEqual(board)
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain("/users/leaderboard?timeframe=month")
    expect(options?.headers).toMatchObject({ Authorization: "Bearer token" })
  })

  it("throws when the leaderboard can't be loaded", async () => {
    respond(false)
    await expect(fetchLeaderboard("week")).rejects.toThrow("Failed to load leaderboard (500)")
  })
})
