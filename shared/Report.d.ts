import type { Card } from "./Card"
import type { ChatMessage } from "./Chat"

export interface Report {
  id: number
  username: string | null
  body: string
  createdAt: string
  tableId: string | null
  tableName: string | null
  userId: string | null
  kind: "report" | "password_reset"
  status: "open" | "resolved"
}

export interface HandPlayer {
  seat: number
  name: string
  dealt: Card[]
  final: Card[] | null
  handRank: string | null
  netResult: number
}

export interface HandAction {
  seat: number
  type: string
  amount: number
  cardsDiscarded: number | null
}

export interface ReportHand {
  id: string
  handNumber: number
  pot: number
  endedAt: string | null
  players: HandPlayer[]
  actions: HandAction[]
}

export interface ReportDetail {
  hands: ReportHand[]
  chat: ChatMessage[]
}
