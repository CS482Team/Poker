import type { ActionType, LegalAction } from "./Actions"
import type { Card } from "./Card"
import type { BettingRound, PlayerId, PlayerStatus, Phase } from "./GameState"

export interface PublicPlayer {
  seat: number
  id: PlayerId
  name: string
  stack: number
  status: PlayerStatus
  betThisRound: number
  lastAction: ActionType | null
  cardCount: number
}

export interface PlayerView {
  gameId: string
  tableId: string
  phase: Phase
  pot: number
  handNumber: number
  dealerSeat: number
  toActSeat: number | null
  round: BettingRound | null
  you: { seat: number; hand: Card[]; legalActions: LegalAction[] }
  players: PublicPlayer[]
  winners: PlayerId[]
  winnings: Record<PlayerId, number> // chips each winner took from the pot; empty until the hand ends
}
