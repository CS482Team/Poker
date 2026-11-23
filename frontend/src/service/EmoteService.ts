/* emotes at a table over the socket (see backend/src/socket/emote.ts) */
import { socketAuth } from "@/service/AuthService"
import type { EmotePlayed, EmoteReply, EmoteSlot } from "@shared/Cosmetics"
import { io } from "socket.io-client"

export interface EmoteConnection {
  /** plays the emote in one of your wheel slots */
  send: (slot: EmoteSlot) => Promise<EmoteReply>
  stop: () => void
}

export function watchEmotes(tableId: string, onPlayed: (played: EmotePlayed) => void): EmoteConnection {
  // TODO like chat, emotes open their own socket; share one with watchTable to save a connection
  const socket = io(process.env.NEXT_PUBLIC_API_URL, { auth: socketAuth })
  socket.on("connect", () => socket.emit("emote:join", tableId))
  socket.on("emote:played", onPlayed)
  return {
    send: (slot) => new Promise((resolve) => socket.emit("emote:send", { tableId, slot }, resolve)),
    stop: () => {
      socket.disconnect()
    },
  }
}
