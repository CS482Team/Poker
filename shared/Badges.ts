// Leaderboard badges: places 1–3 in a week, month or season that has ended (kept for good),
// plus a live all-time badge held only while the player is in the all-time top 3.

export type BadgeTimeframe = "week" | "month" | "season" | "all"
export type BadgePlace = 1 | 2 | 3 // gold, silver, bronze

export interface Badge {
  timeframe: BadgeTimeframe
  place: BadgePlace
  periodStart: string | null // ISO date the period began; null for the live all-time badge
  title: string              // e.g. "Weekly Champion", "Season Runner-up", "All-time Third Place"
  period: string             // e.g. "Week of Nov 16, 2026", "Right now"
}

export const BADGE_PLACES = 3 // places that earn a badge

const TIMEFRAME_ORDER: Record<BadgeTimeframe, number> = { all: 0, season: 1, month: 2, week: 3 }

/* best first: higher place, then the longer timeframe, then the most recent */
export function compareBadges(a: Badge, b: Badge): number {
  return a.place - b.place || TIMEFRAME_ORDER[a.timeframe] - TIMEFRAME_ORDER[b.timeframe] || (b.periodStart ?? "").localeCompare(a.periodStart ?? "")
}

/* the one badge shown on a player's avatar, or null if they have none */
export function featuredBadge(badges: readonly Badge[]): Badge | null {
  return [...badges].sort(compareBadges)[0] ?? null
}
