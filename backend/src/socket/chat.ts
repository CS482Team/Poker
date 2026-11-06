import type { Socket } from "socket.io"
import type { ChatMessage, ChatReply, ChatSend } from "../../../shared/Chat"
import { ChatError, getHistory, sendMessage } from "../services/ChatService"
import { RateLimiter } from "./RateLimiter"

const limiter = new RateLimiter(5, 10_000) // 5 messages per 10 seconds per socket

/* the room a table's chat is sent to */
export function chatRoom(tableId: string) {
  return `chat:${tableId}`
}

/* handles one socket's chat events */
export function registerChat(socket: Socket, broadcast: (message: ChatMessage) => void) {
  socket.on("chat:join", async (tableId: string, ack?: (history: ChatMessage[]) => void) => {
    await socket.join(chatRoom(tableId))
    try {
      ack?.(await getHistory(tableId))
    } catch {
      ack?.([])
    }
  })

  // TODO use the logged in user once auth exists
  socket.on("chat:send", async (send: ChatSend, ack?: (reply: ChatReply) => void) => {
    if (!limiter.allow(socket.id)) {
      ack?.({ ok: false, error: "You're sending messages too fast" })
      return
    }
    try {
      broadcast(await sendMessage(send.tableId, send.userId, send.body))
      ack?.({ ok: true })
    } catch (err) {
      ack?.({ ok: false, error: err instanceof ChatError ? err.message : "Message not sent" })
    }
  })

  socket.on("disconnect", () => limiter.forget(socket.id))
}