/* rules for playing an emote at a table */
import type { EmotePlayed, EmoteSlot } from "../../../shared/Cosmetics"
import { getLoadout } from "../dao/ShopDAO"
import { isSeated } from "../dao/TablePlayersDAO"

const EMOTE_SLOTS: readonly string[] = ["emote_1", "emote_2", "emote_3", "emote_4"]

export class EmoteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EmoteError"
  }
}

export async function playEmote(tableId: string, userId: string, slot: EmoteSlot): Promise<EmotePlayed> {
  if (!EMOTE_SLOTS.includes(slot)) throw new EmoteError("Pick one of your four emote slots")
  if (!(await isSeated(tableId, userId))) throw new EmoteError("Only seated players can use emotes")

  const emote = (await getLoadout(userId))[slot]
  if (!emote) throw new EmoteError("That wheel slot is empty")

  return { tableId, userId, emote }
}
