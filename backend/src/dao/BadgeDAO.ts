import { getSupabase } from "../config/Supabase"
import type { BadgePlace } from "../../../shared/Badges"

/* a top-3 finish in a closed period, as stored (all-time badges are live and never stored) */
export interface BadgeRow {
  userId: string
  timeframe: "week" | "month" | "season"
  periodStart: Date
  place: BadgePlace
}

interface Row {
  user_id: string
  timeframe: BadgeRow["timeframe"]
  period_start: string
  place: BadgePlace
}

const toBadge = (row: Row): BadgeRow => ({ userId: row.user_id, timeframe: row.timeframe, periodStart: new Date(row.period_start), place: row.place })

/* records top-3 finishes; ones already awarded are left as they are */
export async function insertBadges(badges: BadgeRow[]): Promise<void> {
  if (badges.length === 0) return
  const rows = badges.map((b) => ({ user_id: b.userId, timeframe: b.timeframe, period_start: b.periodStart.toISOString(), place: b.place }))
  const { error } = await getSupabase().from("leaderboard_badge").upsert(rows, { onConflict: "user_id,timeframe,period_start", ignoreDuplicates: true })
  if (error) throw error
}

/* every badge held by any of these players (e.g. everyone at a table) */
export async function getBadges(userIds: string[]): Promise<BadgeRow[]> {
  if (userIds.length === 0) return []
  const { data, error } = await getSupabase()
    .from("leaderboard_badge")
    .select("user_id, timeframe, period_start, place")
    .in("user_id", userIds)
  if (error) throw error
  return (data as Row[]).map(toBadge)
}
