export type Timeframe = "week" | "month" | "season" | "all"

export interface LeaderboardEntry {
  rank: number             // players tied on every tiebreaker share a rank (1, 2, 2, 4…)
  movement: number | null  // places gained (+) or lost (-) since the comparison point, 0 if unchanged, null if newly ranked
  userId: string
  username: string
  avatarUrl: string | null
  balance: number          // the player's chips right now, whatever the period
  netWinnings: number      // chips won minus chips lost in hands finished this period
  handsPlayed: number
  handsWon: number         // hands that ended with a profit
  winRate: number          // handsWon / handsPlayed, 0 to 1
}

/* how far a player is from a rank they're chasing */
export interface RankGoal {
  rank: number
  chipsNeeded: number // more net winnings needed to pass whoever holds that rank
}

/* the signed-in player's own standing */
export interface MyStanding {
  entry: LeaderboardEntry | null // null until they've played enough hands to qualify
  balance: number                // their chips right now
  handsPlayed: number
  handsToQualify: number         // 0 once qualified
  nextRank: RankGoal | null      // the player just ahead; null at #1 or before qualifying
  topTier: RankGoal | null       // the last spot on the board; null when already on it or before qualifying
}

export interface Leaderboard {
  timeframe: Timeframe
  label: string               // e.g. "This week", "Season 4, 2026"
  periodStart: string | null  // ISO date, inclusive; null for all-time
  periodEnd: string           // ISO date, exclusive (now, for all-time)
  comparedTo: string          // what movement is measured against, e.g. "last week"
  minHands: number            // hands needed to qualify
  updatedAt: string           // when these standings were worked out
  totalRanked: number         // how many players qualified
  top: LeaderboardEntry[]     // everyone ranked within the top LEADERBOARD_SIZE (more on a tie at the cutoff)
  me: MyStanding | null       // null when signed out, a guest, or an admin
}
