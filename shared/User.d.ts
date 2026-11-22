export interface MyProfile {
  id: string
  username: string
  avatarUrl: string | null
  email: string | null // null for guests
  isGuest: boolean
}

export interface DailyRewardStatus {
  day: number                // 1-7: the reward the user is on (the only one not locked)
  canClaim: boolean          // false if they've claimed in the last 24 hours
  nextClaimAt: string | null // when canClaim turns true, for a countdown
}

export interface Claim {
  day: number                // 1-7: the reward the user is on (the only one not locked)
  rewward: number          // false if they've claimed in the last 24 hours
}