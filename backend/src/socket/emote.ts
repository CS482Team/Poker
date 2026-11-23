/* socket events for emotes: emote:join, emote:send and emote:played */
import type { Socket } from "socket.io"
import type { EmotePlayed, EmoteReply, EmoteSend } from "../../../shared/Cosmetics"
import { EMOTE_COOLDOWN_SECONDS } from "../../../shared/Rules"
import { EmoteError, playEmote } from "../services/EmoteService"
import { RateLimiter } from "./RateLimiter"

// keyed by player, not socket, so opening another tab doesn't get around the cooldown
// TODO like chat's limiter, this lives in memory: it resets on restart and needs one backend server
const cooldown = new RateLimiter(1, EMOTE_COOLDOWN_SECONDS * 1000)

export function emoteRoom(tableId: string) {
  return `emote:${tableId}`
}

export function registerEmotes(socket: Socket, broadcast: (played: EmotePlayed) => void, limiter: RateLimiter = cooldown) {
  socket.on("emote:join", async (tableId: string, ack?: () => void) => {
    await socket.join(emoteRoom(tableId))
    ack?.()
  })

  socket.on("emote:send", async (send: EmoteSend, ack?: (reply: EmoteReply) => void) => {
    const userId = socket.data.userId
    if (!userId) {
      ack?.({ ok: false, error: "Sign in to use emotes" })
      return
    }
    if (!limiter.allow(userId)) {
      ack?.({ ok: false, error: `Slow down: one emote every ${EMOTE_COOLDOWN_SECONDS} seconds` })
      return
    }
    try {
      broadcast(await playEmote(send.tableId, userId, send.slot))
      ack?.({ ok: true })
    } catch (err) {
      ack?.({ ok: false, error: err instanceof EmoteError ? err.message : "Emote not sent" })
    }
  })
}
