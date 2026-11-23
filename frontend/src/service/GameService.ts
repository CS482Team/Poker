import { authHeaders } from "@/service/AuthService"
import type { ActionType } from "@shared/Actions"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function act(gameId: string, type: ActionType, amount?: number): Promise<void> {
  const action = amount === undefined ? { type } : { type, amount }
  const res = await fetch(`${API_URL}/game/${gameId}/action`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ action }),
  })
  if (!res.ok) throw new Error(`Failed to act (${res.status})`)
}

export async function playAgain(gameId: string): Promise<void> {
  const res = await fetch(`${API_URL}/game/${gameId}/again`, { method: "POST", headers: await authHeaders() })
  if (!res.ok) throw new Error(`Failed to vote (${res.status})`)
}

export async function draw(gameId: string, discard: number[]): Promise<void> {
  const res = await fetch(`${API_URL}/game/${gameId}/draw`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ discard }),
  })
  if (!res.ok) throw new Error(`Failed to draw (${res.status})`)
}
