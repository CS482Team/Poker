import { getLeaderboardStats } from "../dao/LeaderboardDAO"
import type { PlayerStats } from "../dao/LeaderboardDAO"
import { getRankableBalance } from "../dao/UserDAO"
import { getLeaderboard, periodFor, rankPlayers } from "./LeaderboardService"

jest.mock("../dao/LeaderboardDAO", () => ({ getLeaderboardStats: jest.fn() }))
jest.mock("../dao/UserDAO", () => ({ getRankableBalance: jest.fn() }))

// Wednesday 25 November 2026, mid-afternoon UTC
const NOW = new Date("2026-11-25T15:30:00Z")

function player(userId: string, netWinnings: number, handsWon = 1, handsPlayed = 5): PlayerStats {
  return { userId, username: userId, avatarUrl: null, balance: 1000 + netWinnings, handsPlayed, handsWon, netWinnings }
}

/* the DAO returns `current` for this period and `previous` for the one movement is measured against */
function stats(current: PlayerStats[], previous: PlayerStats[] = []) {
  jest.mocked(getLeaderboardStats).mockResolvedValueOnce(current).mockResolvedValueOnce(previous)
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getRankableBalance).mockResolvedValue(2000)
})

describe("periodFor", () => {
  it("runs a week from Monday to Monday, compared with last week", () => {
    const p = periodFor("week", NOW)
    expect(p.from).toEqual(new Date("2026-11-23T00:00:00Z"))
    expect(p.to).toEqual(new Date("2026-11-30T00:00:00Z"))
    expect(p.previousFrom).toEqual(new Date("2026-11-16T00:00:00Z"))
    expect(p.previousTo).toEqual(p.from)
    expect(p.comparedTo).toBe("last week")
  })

  it("starts the week that same day on a Monday, and goes back six days on a Sunday", () => {
    expect(periodFor("week", new Date("2026-11-23T00:00:00Z")).from).toEqual(new Date("2026-11-23T00:00:00Z"))
    expect(periodFor("week", new Date("2026-11-29T23:59:00Z")).from).toEqual(new Date("2026-11-23T00:00:00Z"))
  })

  it("runs a month from the 1st, crossing into the next year", () => {
    const p = periodFor("month", new Date("2026-12-10T00:00:00Z"))
    expect(p.from).toEqual(new Date("2026-12-01T00:00:00Z"))
    expect(p.to).toEqual(new Date("2027-01-01T00:00:00Z"))
    expect(p.previousFrom).toEqual(new Date("2026-11-01T00:00:00Z"))
    expect(p.label).toBe("December 2026")
  })

  it("makes seasons calendar quarters, reaching back into last year", () => {
    const p = periodFor("season", new Date("2026-02-14T00:00:00Z"))
    expect(p.from).toEqual(new Date("2026-01-01T00:00:00Z"))
    expect(p.to).toEqual(new Date("2026-04-01T00:00:00Z"))
    expect(p.previousFrom).toEqual(new Date("2025-10-01T00:00:00Z"))
    expect(p.label).toBe("Season 1, 2026")
  })

  it("measures all-time movement against a week ago", () => {
    const p = periodFor("all", NOW)
    expect(p.from).toBeNull()
    expect(p.to).toEqual(NOW)
    expect(p.previousFrom).toBeNull()
    expect(p.previousTo).toEqual(new Date("2026-11-18T15:30:00Z"))
  })
})

describe("rankPlayers", () => {
  it("leaves out players who haven't played enough hands", () => {
    expect(rankPlayers([player("a", 100, 1, 4), player("b", 50)], 5).map((p) => p.userId)).toEqual(["b"])
  })

  it("orders by net winnings, then hands won, then fewer hands played", () => {
    const ranked = rankPlayers([player("few-wins", 100, 1, 5), player("most", 300), player("many-wins", 100, 3, 9), player("quick", 100, 3, 6)], 5)
    expect(ranked.map((p) => [p.userId, p.rank])).toEqual([["most", 1], ["quick", 2], ["many-wins", 3], ["few-wins", 4]])
  })

  it("shares a rank when every tiebreaker is equal, listing by name", () => {
    const ranked = rankPlayers([player("zoe", 100), player("ana", 100), player("leo", 50)], 5)
    expect(ranked.map((p) => [p.userId, p.rank])).toEqual([["ana", 1], ["zoe", 1], ["leo", 3]])
  })
})

describe("getLeaderboard", () => {
  it("reads this period and the comparison period", async () => {
    stats([])
    await getLeaderboard("week", null, NOW)
    expect(getLeaderboardStats).toHaveBeenCalledWith(new Date("2026-11-23T00:00:00Z"), new Date("2026-11-30T00:00:00Z"))
    expect(getLeaderboardStats).toHaveBeenCalledWith(new Date("2026-11-16T00:00:00Z"), new Date("2026-11-23T00:00:00Z"))
  })

  it("describes the period and when it was worked out", async () => {
    stats([])
    const board = await getLeaderboard("week", null, NOW)
    expect(board).toMatchObject({
      timeframe: "week",
      label: "This week",
      periodStart: "2026-11-23T00:00:00.000Z",
      periodEnd: "2026-11-30T00:00:00.000Z",
      comparedTo: "last week",
      minHands: 5,
      updatedAt: NOW.toISOString(),
      totalRanked: 0,
      top: [],
      me: null,
    })
  })

  it("has no start date for all-time", async () => {
    stats([])
    expect((await getLeaderboard("all", null, NOW)).periodStart).toBeNull()
  })

  it("gives each player's balance, stats and win rate", async () => {
    stats([player("maya", 350, 3, 6)])
    const [maya] = (await getLeaderboard("week", null, NOW)).top
    expect(maya).toEqual({ rank: 1, movement: null, userId: "maya", username: "maya", avatarUrl: null, balance: 1350, netWinnings: 350, handsPlayed: 6, handsWon: 3, winRate: 0.5 })
  })

  it("shows places gained, lost and kept, and marks new players", async () => {
    stats(
      [player("up", 300), player("same", 200), player("down", 100), player("new", 50)],
      [player("down", 300), player("same", 200), player("up", 100)],
    )
    const { top } = await getLeaderboard("week", null, NOW)
    expect(top.map((e) => [e.userId, e.movement])).toEqual([["up", 2], ["same", 0], ["down", -2], ["new", null]])
  })

  it("doesn't count last period's unqualified players as ranked", async () => {
    stats([player("maya", 100)], [player("maya", 100, 1, 2)])
    expect((await getLeaderboard("week", null, NOW)).top[0]!.movement).toBeNull()
  })

  it("shows the top 10, plus anyone tied for 10th", async () => {
    const many = Array.from({ length: 12 }, (_, i) => player(`p${String(i).padStart(2, "0")}`, 1000 - i * 10))
    many[10] = player("tied", many[9]!.netWinnings, many[9]!.handsWon, many[9]!.handsPlayed)
    stats(many)
    const board = await getLeaderboard("week", null, NOW)
    expect(board.top.map((e) => e.rank).slice(-2)).toEqual([10, 10])
    expect(board.top).toHaveLength(11)
    expect(board.totalRanked).toBe(12)
  })

  describe("the signed-in player's standing", () => {
    it("is left out for guests and admins", async () => {
      jest.mocked(getRankableBalance).mockResolvedValue(null)
      stats([player("g1", 100)])
      expect((await getLeaderboard("week", "g1", NOW)).me).toBeNull()
    })

    it("says how many more hands they need to qualify", async () => {
      stats([player("maya", 100), player("zoe", 500, 1, 2)])
      expect((await getLeaderboard("week", "zoe", NOW)).me).toEqual({ entry: null, balance: 2000, handsPlayed: 2, handsToQualify: 3, nextRank: null, topTier: null })
    })

    it("counts no hands for a player who hasn't played this period, but still shows their balance", async () => {
      stats([])
      expect((await getLeaderboard("week", "zoe", NOW)).me).toMatchObject({ balance: 2000, handsPlayed: 0, handsToQualify: 5 })
      expect(getRankableBalance).toHaveBeenCalledWith("zoe")
    })

    it("has no next rank at #1", async () => {
      stats([player("maya", 300), player("theo", 100)])
      expect((await getLeaderboard("week", "maya", NOW)).me).toMatchObject({ entry: { rank: 1 }, handsToQualify: 0, nextRank: null, topTier: null })
    })

    it("says how many chips it takes to pass the player just ahead", async () => {
      stats([player("maya", 300), player("theo", 120), player("zoe", 100)])
      expect((await getLeaderboard("week", "zoe", NOW)).me!.nextRank).toEqual({ rank: 2, chipsNeeded: 21 })
    })

    it("needs one chip to pass a player tied on chips who wins the tiebreak", async () => {
      stats([player("maya", 100, 3), player("zoe", 100, 1)])
      expect((await getLeaderboard("week", "zoe", NOW)).me!.nextRank).toEqual({ rank: 1, chipsNeeded: 1 })
    })

    it("chases the player ahead of a group sharing their rank", async () => {
      stats([player("maya", 300), player("ana", 100), player("zoe", 100)])
      expect((await getLeaderboard("week", "zoe", NOW)).me!.nextRank).toEqual({ rank: 1, chipsNeeded: 201 })
    })

    it("says how many chips it takes to reach the board from outside it", async () => {
      stats(Array.from({ length: 12 }, (_, i) => player(`p${String(i).padStart(2, "0")}`, 1000 - i * 10)))
      const me = (await getLeaderboard("week", "p11", NOW)).me!
      expect(me.entry!.rank).toBe(12)
      expect(me.nextRank).toEqual({ rank: 11, chipsNeeded: 11 })
      expect(me.topTier).toEqual({ rank: 10, chipsNeeded: 21 })
    })
  })

  it("passes database errors on", async () => {
    jest.mocked(getLeaderboardStats).mockRejectedValue(new Error("db down"))
    await expect(getLeaderboard("week", null, NOW)).rejects.toThrow("db down")
  })
})
