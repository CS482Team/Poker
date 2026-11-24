import request from "supertest"
import { app } from "../app"
import { getSupabase } from "../config/Supabase"
import { getPlayerHands } from "../dao/MatchDAO"
import { getBalance, getDailyReward, getUserIdFromToken, getUsername, recordDailyClaim, setBalance } from "../dao/UserDAO"
import { getLeaderboard } from "../services/LeaderboardService"

jest.mock("../config/Supabase")
jest.mock("../dao/MatchDAO", () => ({ getPlayerHands: jest.fn() }))

jest.mock("../dao/UserDAO", () => ({
  getBalance: jest.fn(),
  getUsername: jest.fn(),
  setBalance: jest.fn(),
  getUserIdFromToken: jest.fn(),
  getDailyReward: jest.fn(),
  recordDailyClaim: jest.fn(),
}))
jest.mock("../dao/BalanceLogDAO", () => ({ logBalanceChange: jest.fn() }))
jest.mock("../services/LeaderboardService", () => ({ getLeaderboard: jest.fn() }))

const getUser = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getSupabase).mockReturnValue({ auth: { getUser } } as unknown as ReturnType<typeof getSupabase>)
})

describe("users", () => {
  it("returns your balance", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
    jest.mocked(getBalance).mockResolvedValue(2500)
    const res = await request(app).get("/users/me/balance").set("Authorization", "Bearer good")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ balance: 2500 })
    expect(getBalance).toHaveBeenCalledWith("u1")
  })

  it("rejects a hands request with no token", async () => {
    const res = await request(app).get("/users/me/hands")
    expect(res.status).toBe(401)
    expect(getPlayerHands).not.toHaveBeenCalled()
  })

  it("rejects an invalid token", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("bad jwt") })
    const res = await request(app).get("/users/me/hands").set("Authorization", "Bearer bad")
    expect(res.status).toBe(401)
    expect(getPlayerHands).not.toHaveBeenCalled()
  })

  it("returns the signed-in user's own hands", async () => {
    const hand = { matchId: "m1", tableName: "Table", handNumber: 3, pot: 300, winner: "Maya", netResult: 120, endedAt: "2026-11-09T12:00:00Z" }
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    jest.mocked(getPlayerHands).mockResolvedValue([hand])
    const res = await request(app).get("/users/me/hands").set("Authorization", "Bearer good")
    expect(res.status).toBe(200)
    expect(res.body).toEqual([hand])
    expect(getPlayerHands).toHaveBeenCalledWith("u1")
  })

  it("returns the daily reward status", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
    jest.mocked(getDailyReward).mockResolvedValue({ lastClaimAt: null, streak: 0 })
    const res = await request(app).get("/users/me/daily-reward").set("Authorization", "Bearer good")
    expect(res.body).toEqual({ day: 1, canClaim: true, nextClaimAt: null })
  })

  it("claims the daily reward", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
    jest.mocked(getDailyReward).mockResolvedValue({ lastClaimAt: null, streak: 0 })
    jest.mocked(recordDailyClaim).mockResolvedValue(true)
    jest.mocked(getBalance).mockResolvedValue(500)
    const res = await request(app).post("/users/me/daily-reward").set("Authorization", "Bearer good")
    expect(res.body).toEqual({ day: 1, reward: 100, balance: 600 })
    expect(setBalance).toHaveBeenCalledWith("u1", 600)
  })

  it("refuses a second claim", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
    jest.mocked(getDailyReward).mockResolvedValue({ lastClaimAt: new Date().toISOString(), streak: 1 })
    const res = await request(app).post("/users/me/daily-reward").set("Authorization", "Bearer good")
    expect(res.status).toBe(409)
    expect(setBalance).not.toHaveBeenCalled()
  })

  it("returns a user's username", async () => {
    jest.mocked(getUsername).mockResolvedValue("Maya")
    const res = await request(app).get("/users/u1/username")
    expect(res.body).toEqual({ username: "Maya" })
  })

  describe("leaderboard", () => {
    const board = { timeframe: "week", top: [], me: null } as unknown as Awaited<ReturnType<typeof getLeaderboard>>

    it("shows this week's leaderboard to anyone, without a standing of their own", async () => {
      jest.mocked(getLeaderboard).mockResolvedValue(board)
      const res = await request(app).get("/users/leaderboard")
      expect(res.status).toBe(200)
      expect(res.body).toEqual(board)
      expect(getLeaderboard).toHaveBeenCalledWith("week", null)
      expect(getUserIdFromToken).not.toHaveBeenCalled()
    })

    it("uses the timeframe asked for and the signed-in player", async () => {
      jest.mocked(getUserIdFromToken).mockResolvedValue("u2")
      jest.mocked(getLeaderboard).mockResolvedValue(board)
      const res = await request(app).get("/users/leaderboard?timeframe=season").set("Authorization", "Bearer good")
      expect(res.status).toBe(200)
      expect(getUserIdFromToken).toHaveBeenCalledWith("good")
      expect(getLeaderboard).toHaveBeenCalledWith("season", "u2")
    })

    it("rejects an unknown timeframe", async () => {
      const res = await request(app).get("/users/leaderboard?timeframe=decade")
      expect(res.status).toBe(400)
      expect(getLeaderboard).not.toHaveBeenCalled()
    })

    it("returns 500 when the leaderboard can't be loaded", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {})
      jest.mocked(getLeaderboard).mockRejectedValue(new Error("db down"))
      const res = await request(app).get("/users/leaderboard")
      expect(res.status).toBe(500)
      expect(res.body).toEqual({ error: "Could not load leaderboard" })
    })
  })
})
