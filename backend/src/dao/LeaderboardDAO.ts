import { getSupabase } from "../config/Supabase"

/* one player's hand totals for a time window */
export interface PlayerStats {
  userId: string
  username: string
  avatarUrl: string | null
  balance: number
  handsPlayed: number
  handsWon: number
  netWinnings: number
}

interface StatsRow {
  user_id: string
  username: string
  avatar_url: string | null
  balance: number
  hands_played: number
  hands_won: number
  net_winnings: number
}

/* current balance and totals for every ranked player (no guests or admins) with a hand finished in [from, to); from null means all time.
   Added up in Postgres by the leaderboard_stats function (see migrations). */
export async function getLeaderboardStats(from: Date | null, to: Date): Promise<PlayerStats[]> {
  const { data, error } = await getSupabase().rpc("leaderboard_stats", {
    p_from: from?.toISOString() ?? null,
    p_to: to.toISOString(),
  })
  if (error) throw error
  return (data as StatsRow[]).map((row) => ({
    userId: row.user_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    balance: row.balance,
    handsPlayed: row.hands_played,
    handsWon: row.hands_won,
    netWinnings: Number(row.net_winnings), // bigint in Postgres
  }))
}
