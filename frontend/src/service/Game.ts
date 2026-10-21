import type { Card } from "@/util/Card"

// Mirrors the backend types in backend/src/services/Game.ts and backend/src/game/Betting.ts; keep in sync
export type ActionType = "fold" | "check" | "call" | "bet" | "raise"
export interface LegalAction { type: ActionType; amount: number }

export type Phase = "waiting" | "predraw-betting" | "draw" | "postdraw-betting" | "showdown" | "hand-complete"
export type PlayerStatus = "active" | "folded" | "all-in" | "sitting-out"

export interface PublicPlayer {
  seat: number
  id: string
  name: string
  stack: number
  status: PlayerStatus
  betThisRound: number
  cardCount: number
}

export interface PlayerView {
  gameId: string
  phase: Phase
  pot: number
  handNumber: number
  dealerSeat: number
  toActSeat: number | null
  round: { street: "predraw" | "postdraw"; betSize: number; currentBet: number; betsMade: number } | null
  you: { seat: number; hand: Card[]; legalActions: LegalAction[] }
  players: PublicPlayer[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// Sends a request to the backend and returns its JSON, or throws with the backend's error code
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`)
  return body as T
}

// Starts a new game (demo bots for now) and deals the first hand
export function startGame(): Promise<{ gameId: string; matchId: string }> {
  return request("/game", { method: "POST" })
}

// The game as one player sees it: their own cards, and what they're allowed to do
export function getView(gameId: string, playerId: string): Promise<PlayerView> {
  return request(`/game/${gameId}/view/${playerId}`)
}

// Plays a betting action for a player and returns their updated view
export function act(gameId: string, playerId: string, type: ActionType): Promise<PlayerView> {
  return request(`/game/${gameId}/action`, {
    method: "POST",
    body: JSON.stringify({ playerId, action: { type } }),
  })
}
