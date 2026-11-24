import type { Badge } from "./Badges"

export interface MyProfile {
  id: string
  username: string
  avatarUrl: string | null
  email: string | null
  isGuest: boolean
  badges: Badge[]  // best first (see Badges.ts compareBadges)
}

export interface DailyRewardStatus {
  day: number
  canClaim: boolean
  nextClaimAt: string | null
}

export interface DailyRewardClaim {
  day: number
  reward: number
  balance: number
}
