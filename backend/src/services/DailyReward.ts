import { DAILY_REWARDS } from "../../../shared/Rules"
import type { DailyRewardStatus } from "../../../shared/User"

const WINDOW_MS = 24 * 60 * 60 * 1000

export function dailyRewardStatus(lastClaimAt: Date | null, streak: number, now: Date): DailyRewardStatus {
  if (!lastClaimAt) return { day: 1, canClaim: true, nextClaimAt: null }

  const since = now.getTime() - lastClaimAt.getTime()
  const next = (streak % DAILY_REWARDS.length) + 1

  if (since < WINDOW_MS) return { day: next, canClaim: false, nextClaimAt: new Date(lastClaimAt.getTime() + WINDOW_MS).toISOString() }
  if (since < 2 * WINDOW_MS) return { day: next, canClaim: true, nextClaimAt: null }
  return { day: 1, canClaim: true, nextClaimAt: null }
}
