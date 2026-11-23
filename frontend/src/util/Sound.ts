/* works out which sounds a change at the table should make, from the previous and next game views */
import type { SoundEffect } from "@/service/SoundService"
import type { ActionType } from "@shared/Actions"
import type { PlayerView } from "@shared/PlayerView"

const ACTION_SOUNDS: Record<ActionType, SoundEffect> = { check: "check", call: "chips", bet: "chips", raise: "chips", fold: "fold" }

export function soundsForViewChange(prev: PlayerView | null, next: PlayerView | null): SoundEffect[] {
  // the first view (joining a table) and leaving one stay quiet
  if (!prev || !next) return []
  if (next.handNumber !== prev.handNumber || next.gameId !== prev.gameId) return ["deal"]

  const sounds = new Set<SoundEffect>()

  for (const player of next.players) {
    const before = prev.players.find((p) => p.id === player.id)
    // lastAction resets each betting round, so a changed action or bet means they just acted
    if (player.lastAction && (player.lastAction !== before?.lastAction || player.betThisRound !== before?.betThisRound)) {
      sounds.add(ACTION_SOUNDS[player.lastAction])
    }
  }

  const mySeat = next.you.seat
  if (mySeat >= 0 && next.toActSeat === mySeat && prev.toActSeat !== mySeat) sounds.add("turn")

  if (next.winners.length > 0 && prev.winners.length === 0) sounds.add("win")

  return [...sounds]
}
