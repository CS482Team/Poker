import type { ActionType } from "@shared/Actions"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function act(gameId: string, playerId: string, type: ActionType, amount?: number): Promise<void> {
  const action = amount === undefined ? { type } : { type, amount }
  const res = await fetch(`${API_URL}/game/${gameId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, action }),
  })
  if (!res.ok) throw new Error(`Failed to act (${res.status})`)
}
