import type { ChatMessage, ChatReply } from "@shared/Chat"
import { io } from "socket.io-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface ChatConnection {
  send: (body: string) => Promise<ChatReply>
  stop: () => void
}

/* joins a table's chat, gives its history then each new message */
// TODO chat opens its own socket; share one with watchTable to save a connection
export function watchChat(
  tableId: string,
  userId: string,
  onHistory: (messages: ChatMessage[]) => void,
  onMessage: (message: ChatMessage) => void,
): ChatConnection {
  const socket = io(API_URL)
  socket.on("connect", () => socket.emit("chat:join", tableId, onHistory))
  socket.on("chat:message", onMessage)
  return {
    send: (body) => new Promise((resolve) => socket.emit("chat:send", { tableId, userId, body }, resolve)),
    stop: () => {
      socket.disconnect()
    },
  }
}