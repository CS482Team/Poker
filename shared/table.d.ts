export interface Table {
  id: string
  name: string
  status: number // 1 for active, 0 for inavtive
  variant: string
  buyIn: number
  minimumBet: number
  ante: number
  maxPlayers: number
  players: number
}

export interface Seat {
  userId: string
  username: string
  seatNumber: number
  stack: number
}

export interface TableDetail {
  id: string
  name: string
  maxPlayers: number
  buyIn: number
  minimumBet: number
  ante: number
  seats: Seat[]
}

export interface NewTable {
  hostId: string
  name: string
  maxPlayers: number
  buyIn: number
  minimumBet: number
  ante: number
}
