export interface Table {
  id: string
  name: string
  status: number // 1 for active, 0 for inactive
  variant: string
  buyIn: number
  minimumBet: number
  ante: number
  maxPlayers: number
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

export interface Seat {
  userId: string
  username: string
  seatNumber: number
  stack: number
}
