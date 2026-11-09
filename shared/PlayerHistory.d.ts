export interface PlayerSummary {
  id: string
  username: string
  balance: number
  handsPlayed: number
}

export interface HandRecord {
  matchId: string
  tableName: string
  handNumber: number
  pot: number
  winner: string | null
  netResult: number
  endedAt: string
}
