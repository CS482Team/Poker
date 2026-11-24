import { BADGE_PLACES, compareBadges, featuredBadge } from "../../../shared/Badges"
import type { Badge, BadgePlace, BadgeTimeframe } from "../../../shared/Badges"
import { LEADERBOARD_MIN_HANDS } from "../../../shared/Rules"
import type { Table } from "../../../shared/Table"
import { getLeaderboardStats } from "../dao/LeaderboardDAO"
import { getBadges, insertBadges } from "../dao/BadgeDAO"
import type { BadgeRow } from "../dao/BadgeDAO"
import { periodFor, rankPlayers } from "./LeaderboardService"

/* the timeframes that close and leave a badge behind; all-time never closes, so its badge is live */
export const CLOSING_TIMEFRAMES = ["week", "month", "season"] as const

/* how long the live all-time top 3 is reused before it's worked out again */
export const LIVE_TTL_MS = 60_000

/* the start of the last period whose top 3 were awarded, per timeframe; saves re-checking on every request.
   Awarding is safe to repeat, so a restart only costs one extra check. */
const awardedThrough = new Map<string, number>()
let liveCache: { at: number; places: Map<string, BadgePlace> } | null = null

/* Gives badges to everyone placed 1st–3rd in the week, month and season that most recently ended.
   There's no scheduler: this runs when profiles, the leaderboard and tables load, and periods are fixed by the calendar,
   so whoever triggers it first after a period ends awards it. (A period no one visits during is never awarded.) */
export async function awardClosedPeriods(now: Date = new Date()): Promise<void> {
  await Promise.all(
    CLOSING_TIMEFRAMES.map(async (timeframe) => {
      const { previousFrom, previousTo } = periodFor(timeframe, now)
      const start = previousFrom!.getTime()
      if (awardedThrough.get(timeframe) === start) return
      const ranked = rankPlayers(await getLeaderboardStats(previousFrom, previousTo), LEADERBOARD_MIN_HANDS[timeframe])
      const placed = ranked.filter((p) => p.rank <= BADGE_PLACES)
      await insertBadges(placed.map((p) => ({ userId: p.userId, timeframe, periodStart: previousFrom!, place: p.rank as BadgePlace })))
      awardedThrough.set(timeframe, start)
    }),
  )
}

/* who's in the all-time top 3 right now, and where; reused for LIVE_TTL_MS */
export async function liveAllTimePlaces(now: Date = new Date()): Promise<Map<string, BadgePlace>> {
  if (liveCache && now.getTime() - liveCache.at < LIVE_TTL_MS) return liveCache.places
  const ranked = rankPlayers(await getLeaderboardStats(null, now), LEADERBOARD_MIN_HANDS.all)
  const places = new Map(ranked.filter((p) => p.rank <= BADGE_PLACES).map((p) => [p.userId, p.rank as BadgePlace]))
  liveCache = { at: now.getTime(), places }
  return places
}

/* every badge for each of these players, best first; awards any that are due first.
   Badges are a bonus: if anything fails, players just show fewer (or none) rather than the page breaking. */
export async function badgesFor(userIds: string[], now: Date = new Date()): Promise<Map<string, Badge[]>> {
  const result = new Map<string, Badge[]>(userIds.map((id) => [id, []]))
  if (userIds.length === 0) return result
  await awardClosedPeriods(now).catch((err) => console.error("awardClosedPeriods failed:", err))
  const [stored, live] = await Promise.all([
    getBadges(userIds).catch((err) => (console.error("getBadges failed:", err), [] as BadgeRow[])),
    liveAllTimePlaces(now).catch((err) => (console.error("liveAllTimePlaces failed:", err), new Map<string, BadgePlace>())),
  ])
  for (const row of stored) result.get(row.userId)?.push(describeBadge(row.timeframe, row.place, row.periodStart))
  for (const id of userIds) {
    const place = live.get(id)
    if (place) result.get(id)!.push(describeBadge("all", place, null))
  }
  for (const badges of result.values()) badges.sort(compareBadges)
  return result
}

/* a player's badges, best first */
export async function getMyBadges(userId: string, now: Date = new Date()): Promise<Badge[]> {
  return (await badgesFor([userId], now)).get(userId)!
}

/* adds each seated player's best badge, shown on their avatar */
export async function withBadges(table: Table, now: Date = new Date()): Promise<Table> {
  const badges = await badgesFor(table.seats.map((s) => s.userId), now)
  return { ...table, seats: table.seats.map((seat) => ({ ...seat, badge: featuredBadge(badges.get(seat.userId) ?? []) })) }
}

const PLACE_TITLES: Record<BadgePlace, string> = { 1: "Champion", 2: "Runner-up", 3: "Third Place" }
const TIMEFRAME_TITLES: Record<BadgeTimeframe, string> = { week: "Weekly", month: "Monthly", season: "Season", all: "All-time" }

/* "Weekly Champion" / "Week of Nov 16, 2026", "Monthly Runner-up" / "November 2026",
   "Season Third Place" / "Season 4, 2026", "All-time Champion" / "Right now" */
export function describeBadge(timeframe: BadgeTimeframe, place: BadgePlace, periodStart: Date | null): Badge {
  const title = `${TIMEFRAME_TITLES[timeframe]} ${PLACE_TITLES[place]}`
  const base = { timeframe, place, periodStart: periodStart?.toISOString() ?? null, title }
  if (!periodStart) return { ...base, period: "Right now" }
  const opts = { timeZone: "UTC" } as const
  if (timeframe === "week") return { ...base, period: `Week of ${periodStart.toLocaleDateString("en-US", { ...opts, month: "short", day: "numeric", year: "numeric" })}` }
  if (timeframe === "month") return { ...base, period: periodStart.toLocaleString("en-US", { ...opts, month: "long", year: "numeric" }) }
  return { ...base, period: `Season ${Math.floor(periodStart.getUTCMonth() / 3) + 1}, ${periodStart.getUTCFullYear()}` }
}

/* for tests */
export function resetBadgeCaches() {
  awardedThrough.clear()
  liveCache = null
}
