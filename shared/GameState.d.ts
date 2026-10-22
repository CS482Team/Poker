import type { Card } from "./Card"

export type PlayerId = string // TODO socket.id for now use Supabase user id after Heloisa's auth
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
export type StartError = "too-few-players" | "too-many-players" | "wrong-phase"

export interface TableConfig { // TABLE SETTINGS
  ante: number
  smallBet: number        // pre-draw bet/raise size
  bigBet: number          // post-draw bet/raise size (normally 2 × smallBet)
  maxBetsPerRound: number // 4 = one bet + three raises
}

export interface SeatInput { 
  id: PlayerId; name: 
  string; stack: number 
} // what tables (Cyrus) hand to createGame

export type PlayerStatus = "active" | "folded" | "all-in" | "sitting-out"

export interface PlayerState {
  id: PlayerId
  name: string
  stack: number
  hand: Card[]
  status: PlayerStatus
  betThisRound: number     // chips put in during the current betting round
  totalContributed: number // chips put in this hand, antes included (S4 side pots)
  hasActed: boolean        // acted since the last bet/raise in this round
}

export type Street = "predraw" | "postdraw"

export interface BettingRound {
  street: Street
  betSize: number   // smallBet or bigBet
  currentBet: number // highest betThisRound at the table
  betsMade: number  // 0..maxBetsPerRound (a bet counts 1, each raise +1)
}

export type Phase =
  | "waiting"           // created, no hand dealt yet
  | "predraw-betting"   // S2
  | "draw"              // S3 (Sean) -can change if needed, just for test setup
  | "postdraw-betting"  // S2
  | "showdown"          // S4 (Sean): pay out the pot -can change if needed
  | "hand-complete"     // S4 done; S1 can start the next hand

export interface GameState {
  id: string
  tableId: string
  config: TableConfig
  players: PlayerState[]     // in seat order; index = seat
  dealerIndex: number
  toActIndex: number | null  // null when nobody is to act
  phase: Phase
  deck: Card[]               // remaining cards; Sean draws replacements from here
  pot: number
  round: BettingRound | null // null outside betting phases
  handNumber: number
}
