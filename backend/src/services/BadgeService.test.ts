import { getBadges, insertBadges } from "../dao/BadgeDAO"
import { getLeaderboardStats } from "../dao/LeaderboardDAO"
import type { PlayerStats } from "../dao/LeaderboardDAO"
import type { Table } from "../../../shared/Table"
import { awardClosedPeriods, describeBadge, getMyBadges, liveAllTimePlaces, LIVE_TTL_MS, resetBadgeCaches, withBadges } from "./BadgeService"

jest.mock("../dao/LeaderboardDAO", () => ({ getLeaderboardStats: jest.fn() }))
jest.mock("../dao/BadgeDAO", () => ({ getBadges: jest.fn(), insertBadges: jest.fn() }))

// Wednesday 25 November 2026: last week began Mon 16 Nov, last month was October, last season was Jul–Sep
const NOW = new Date("2026-11-25T15:30:00Z")
const LAST_WEEK = new Date("2026-11-16T00:00:00Z")
const LAST_MONTH = new Date("2026-10-01T00:00:00Z")
const LAST_SEASON = new Date("2026-07-01T00:00:00Z")

function player(userId: string, netWinnings: number, handsPlayed = 50): PlayerStats {
  return { userId, username: userId, avatarUrl: null, balance: 1000, handsPlayed, handsWon: 1, netWinnings }
}

/* closed periods get `closed`; the all-time query (from null) gets `allTime` */
function standings(closed: PlayerStats[], allTime: PlayerStats[] = []) {
  jest.mocked(getLeaderboardStats).mockImplementation(async (from) => (from === null ? allTime : closed))
}

/* the badges awarded for one timeframe, as "user:place" */
function awarded(timeframe: string) {
  return jest.mocked(insertBadges).mock.calls.flatMap(([rows]) => rows).filter((r) => r.timeframe === timeframe).map((r) => `${r.userId}:${r.place}`)
}

beforeEach(() => {
  jest.resetAllMocks()
  resetBadgeCaches()
  jest.mocked(insertBadges).mockResolvedValue()
  jest.mocked(getBadges).mockResolvedValue([])
})

describe("awardClosedPeriods", () => {
  it("awards gold, silver and bronze for the week, month and season that just ended", async () => {
    standings([player("amy", 500), player("ben", 900), player("cal", 100), player("dee", 50)])
    await awardClosedPeriods(NOW)
    expect(getLeaderboardStats).toHaveBeenCalledWith(LAST_WEEK, new Date("2026-11-23T00:00:00Z"))
    expect(getLeaderboardStats).toHaveBeenCalledWith(LAST_MONTH, new Date("2026-11-01T00:00:00Z"))
    expect(getLeaderboardStats).toHaveBeenCalledWith(LAST_SEASON, new Date("2026-10-01T00:00:00Z"))
    for (const tf of ["week", "month", "season"]) expect(awarded(tf)).toEqual(["ben:1", "amy:2", "cal:3"])
    expect(jest.mocked(insertBadges).mock.calls[0]![0][0]).toEqual({ userId: "ben", timeframe: "week", periodStart: LAST_WEEK, place: 1 })
  })

  it("lets tied players share a place, skipping the places after it", async () => {
    standings([player("amy", 900), player("ben", 900), player("cal", 100), player("dee", 50)])
    await awardClosedPeriods(NOW)
    expect(awarded("week")).toEqual(["amy:1", "ben:1", "cal:3"])
  })

  it("skips players who didn't play enough hands to be ranked", async () => {
    standings([player("amy", 5000, 1), player("ben", 900)])
    await awardClosedPeriods(NOW)
    expect(awarded("week")).toEqual(["ben:1"])
  })

  it("only checks each period once, and again once the next one ends", async () => {
    standings([player("ben", 900)])
    await awardClosedPeriods(NOW)
    await awardClosedPeriods(new Date("2026-11-26T09:00:00Z"))
    expect(getLeaderboardStats).toHaveBeenCalledTimes(3)
    await awardClosedPeriods(new Date("2026-11-30T09:00:00Z")) // a new week; same month and season
    expect(getLeaderboardStats).toHaveBeenCalledTimes(4)
  })

  it("tries again next time if awarding failed", async () => {
    standings([player("ben", 900)])
    jest.mocked(insertBadges).mockRejectedValueOnce(new Error("db down"))
    await expect(awardClosedPeriods(NOW)).rejects.toThrow("db down")
    await awardClosedPeriods(NOW)
    expect(awarded("week")).toHaveLength(2)
  })
})

describe("liveAllTimePlaces", () => {
  it("is the current all-time top 3", async () => {
    standings([], [player("amy", 10), player("ben", 30), player("cal", 20), player("dee", 5), player("eve", 999, 3)])
    expect(await liveAllTimePlaces(NOW)).toEqual(new Map([["ben", 1], ["cal", 2], ["amy", 3]]))
    expect(getLeaderboardStats).toHaveBeenCalledWith(null, NOW)
  })

  it("is reused for a minute, then worked out again", async () => {
    standings([], [player("amy", 10)])
    await liveAllTimePlaces(NOW)
    await liveAllTimePlaces(new Date(NOW.getTime() + LIVE_TTL_MS - 1))
    expect(getLeaderboardStats).toHaveBeenCalledTimes(1)
    await liveAllTimePlaces(new Date(NOW.getTime() + LIVE_TTL_MS))
    expect(getLeaderboardStats).toHaveBeenCalledTimes(2)
  })
})

describe("getMyBadges", () => {
  it("lists stored and live badges, best first", async () => {
    standings([], [player("x", 50), player("ben", 40)])
    jest.mocked(getBadges).mockResolvedValue([
      { userId: "ben", timeframe: "week", periodStart: LAST_WEEK, place: 1 },
      { userId: "ben", timeframe: "season", periodStart: LAST_SEASON, place: 3 },
      { userId: "ben", timeframe: "month", periodStart: LAST_MONTH, place: 1 },
    ])
    const badges = await getMyBadges("ben", NOW)
    expect(badges.map((b) => b.title)).toEqual(["Monthly Champion", "Weekly Champion", "All-time Runner-up", "Season Third Place"])
    expect(badges[2]).toEqual({ timeframe: "all", place: 2, periodStart: null, title: "All-time Runner-up", period: "Right now" })
    expect(getBadges).toHaveBeenCalledWith(["ben"])
  })

  it("still lists what it can if parts fail", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.mocked(getLeaderboardStats).mockRejectedValue(new Error("db down"))
    jest.mocked(getBadges).mockResolvedValue([{ userId: "ben", timeframe: "week", periodStart: LAST_WEEK, place: 2 }])
    expect((await getMyBadges("ben", NOW)).map((b) => b.title)).toEqual(["Weekly Runner-up"])
    jest.mocked(getBadges).mockRejectedValue(new Error("db down"))
    expect(await getMyBadges("ben", NOW)).toEqual([])
  })
})

describe("withBadges", () => {
  const table = {
    id: "t1", name: "T", hostId: null, status: 1, variant: "five-card-draw", buyIn: 100, minimumBet: 5, ante: 1,
    maxPlayers: 4, botCount: 0, chatEnabled: true, turnTimerEnabled: false,
    seats: [
      { userId: "amy", username: "Amy", seatNumber: 0, stack: 100 },
      { userId: "ben", username: "Ben", seatNumber: 1, stack: 100 },
    ],
  } satisfies Table

  it("gives each seated player their best badge, or null", async () => {
    standings([])
    jest.mocked(getBadges).mockResolvedValue([
      { userId: "amy", timeframe: "week", periodStart: LAST_WEEK, place: 3 },
      { userId: "amy", timeframe: "month", periodStart: LAST_MONTH, place: 2 },
    ])
    const result = await withBadges(table, NOW)
    expect(getBadges).toHaveBeenCalledWith(["amy", "ben"])
    expect(result.seats[0]!.badge).toMatchObject({ title: "Monthly Runner-up" })
    expect(result.seats[1]!.badge).toBeNull()
  })
})

describe("describeBadge", () => {
  it("names each timeframe and place", () => {
    expect(describeBadge("week", 1, LAST_WEEK)).toMatchObject({ title: "Weekly Champion", period: "Week of Nov 16, 2026" })
    expect(describeBadge("month", 2, LAST_MONTH)).toMatchObject({ title: "Monthly Runner-up", period: "October 2026" })
    expect(describeBadge("season", 3, LAST_SEASON)).toMatchObject({ title: "Season Third Place", period: "Season 3, 2026" })
    expect(describeBadge("all", 1, null)).toMatchObject({ title: "All-time Champion", period: "Right now", periodStart: null })
  })
})
