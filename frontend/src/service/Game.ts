import type { Card } from "@/util/Card"

// Mirrors DemoDeal in backend/src/controller/Demo.ts; keep in sync
export interface DemoPlayer { seat: number; name: string; stack: number; status: string; hand: Card[] }
export interface DemoDeal { matchId: string; pot: number; dealerSeat: number; toActSeat: number | null; players: DemoPlayer[] }

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export async function dealDemo(): Promise<DemoDeal> {
  const res = await fetch(`${API_URL}/demo/deal`, { method: "POST" })
  if (!res.ok) throw new Error(`Deal failed (${res.status})`)
  return res.json()
}