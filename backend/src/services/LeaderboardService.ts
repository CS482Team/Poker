import type { Leaderboard, LeaderboardEntry, MyStanding, RankGoal, Timeframe } from "../../../shared/Leaderboard"
import { LEADERBOARD_MIN_HANDS, LEADERBOARD_SIZE } from "../../../shared/Rules"
import { getLeaderboardStats } from "../dao/LeaderboardDAO"
import type { PlayerStats } from "../dao/LeaderboardDAO"
import { getRankableBalance } from "../dao/UserDAO"

const DAY = 24 * 60 * 60 * 1000

/* the window a timeframe covers, and the earlier window rank movement is measured against (all UTC) */
export interface Period {
  from: Date | null // inclusive; null means from the beginning
  to: Date          // exclusive
  previousFrom: Date | null
  previousTo: Date
  label: string
  comparedTo: string
}

/* Weeks start Monday, months on the 1st, seasons are calendar quarters (Jan, Apr, Jul, Oct).
   All-time has no previous period, so its movement is measured against the standings a week ago. */
export function periodFor(timeframe: Timeframe, now: Date): Period {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  if (timeframe === "week") {
    const sinceMonday = (now.getUTCDay() + 6) % 7
    const from = new Date(Date.UTC(y, m, now.getUTCDate() - sinceMonday))
    return {
      from,
      to: new Date(from.getTime() + 7 * DAY),
      previousFrom: new Date(from.getTime() - 7 * DAY),
      previousTo: from,
      label: "This week",
      comparedTo: "last week",
    }
  }
  if (timeframe === "month") {
    const from = new Date(Date.UTC(y, m, 1))
    return {
      from,
      to: new Date(Date.UTC(y, m + 1, 1)),
      previousFrom: new Date(Date.UTC(y, m - 1, 1)),
      previousTo: from,
      label: from.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      comparedTo: "last month",
    }
  }
  if (timeframe === "season") {
    const first = Math.floor(m / 3) * 3
    const from = new Date(Date.UTC(y, first, 1))
    return {
      from,
      to: new Date(Date.UTC(y, first + 3, 1)),
      previousFrom: new Date(Date.UTC(y, first - 3, 1)),
      previousTo: from,
      label: `Season ${first / 3 + 1}, ${y}`,
      comparedTo: "last season",
    }
  }
  return { from: null, to: now, previousFrom: null, previousTo: new Date(now.getTime() - 7 * DAY), label: "All-time", comparedTo: "7 days ago" }
}

/* Best first: most net winnings, then most hands won, then fewest hands played (the same result in fewer hands).
   Players equal on all three share a rank; the name only fixes the order they're listed in. */
function compare(a: PlayerStats, b: PlayerStats) {
  return b.netWinnings - a.netWinnings || b.handsWon - a.handsWon || a.handsPlayed - b.handsPlayed || a.username.localeCompare(b.username)
}

function tied(a: PlayerStats, b: PlayerStats) {
  return a.netWinnings === b.netWinnings && a.handsWon === b.handsWon && a.handsPlayed === b.handsPlayed
}

/* qualified players in order, each with their rank */
export function rankPlayers(stats: PlayerStats[], minHands: number): (PlayerStats & { rank: number })[] {
  const sorted = stats.filter((s) => s.handsPlayed >= minHands).sort(compare)
  const ranked: (PlayerStats & { rank: number })[] = []
  sorted.forEach((s, i) => {
    const prev = ranked[i - 1]
    ranked.push({ ...s, rank: prev && tied(prev, s) ? prev.rank : i + 1 })
  })
  return ranked
}

/* the leaderboard for a timeframe, plus where `userId` stands (if given and rankable) */
export async function getLeaderboard(timeframe: Timeframe, userId: string | null, now: Date = new Date()): Promise<Leaderboard> {
  const period = periodFor(timeframe, now)
  const minHands = LEADERBOARD_MIN_HANDS[timeframe]
  const [current, previous] = await Promise.all([
    getLeaderboardStats(period.from, period.to),
    getLeaderboardStats(period.previousFrom, period.previousTo),
  ])

  const previousRanks = new Map(rankPlayers(previous, minHands).map((p) => [p.userId, p.rank]))
  const entries: LeaderboardEntry[] = rankPlayers(current, minHands).map((p) => {
    const before = previousRanks.get(p.userId)
    return {
      rank: p.rank,
      movement: before === undefined ? null : before - p.rank,
      userId: p.userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      balance: p.balance,
      netWinnings: p.netWinnings,
      handsPlayed: p.handsPlayed,
      handsWon: p.handsWon,
      winRate: p.handsWon / p.handsPlayed,
    }
  })

  return {
    timeframe,
    label: period.label,
    periodStart: period.from?.toISOString() ?? null,
    periodEnd: period.to.toISOString(),
    comparedTo: period.comparedTo,
    minHands,
    updatedAt: now.toISOString(),
    totalRanked: entries.length,
    top: entries.filter((e) => e.rank <= LEADERBOARD_SIZE),
    me: userId ? await myStanding(userId, entries, current, minHands) : null,
  }
}

/* the player's balance and own row, or how many hands until they qualify, and how far they are from the next places;
   null for guests and admins, who aren't ranked */
async function myStanding(userId: string, entries: LeaderboardEntry[], stats: PlayerStats[], minHands: number): Promise<MyStanding | null> {
  const balance = await getRankableBalance(userId)
  if (balance === null) return null
  const handsPlayed = stats.find((s) => s.userId === userId)?.handsPlayed ?? 0
  const entry = entries.find((e) => e.userId === userId) ?? null
  const ahead = entry && [...entries].reverse().find((e) => e.rank < entry.rank)
  const lastOnBoard = entry && entry.rank > LEADERBOARD_SIZE ? [...entries].reverse().find((e) => e.rank <= LEADERBOARD_SIZE) : null
  return {
    entry,
    balance,
    handsPlayed,
    handsToQualify: Math.max(0, minHands - handsPlayed),
    nextRank: entry && ahead ? goal(entry, ahead) : null,
    topTier: entry && lastOnBoard ? goal(entry, lastOnBoard) : null,
  }
}

/* one more chip than the target always passes them, whatever the tiebreakers say */
function goal(me: LeaderboardEntry, target: LeaderboardEntry): RankGoal {
  return { rank: target.rank, chipsNeeded: target.netWinnings - me.netWinnings + 1 }
}
