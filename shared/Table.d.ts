import type { Badge } from "./Badges"
import type { PublicCosmetics } from "./Cosmetics"

export interface Table {
  id: string
  name: string
  hostId: string | null
  status: number // 1 for active, 0 for inactive
  variant: string
  buyIn: number
  minimumBet: number
  ante: number
  maxPlayers: number
  botCount: number
  chatEnabled: boolean
  turnTimerEnabled: boolean
  seats: Seat[]
}

export interface NewTable {
  name: string
  maxPlayers: number
  buyIn: number
  minimumBet: number
  ante: number
  botCount?: number
}

export interface Seat {
  userId: string
  username: string
  avatarUrl?: string | null
  seatNumber: number
  stack: number
  // added by ShopService.withCosmetics when a table is sent to the browser
  cosmetics?: PublicCosmetics
  // the player's best leaderboard badge, added by BadgeService.withBadges; null if they have none
  badge?: Badge | null
}

/* what the host can change after a table is made */
export interface TableSettings {
  name: string
  botCount: number
  chatEnabled: boolean
  turnTimerEnabled: boolean
}