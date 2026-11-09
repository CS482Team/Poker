import type { Server as HttpServer } from "http"
import { Server } from "socket.io"
import type { ChatMessage } from "../../../shared/Chat"
import { getAllTables, getTable } from "../dao/TableDAO"
import { getTableView } from "../services/GameService"
import { chatRoom, registerChat } from "./chat"

const LOBBY = "lobby"
let io: Server | undefined

/* starts the socket server */
export function initSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: process.env.FRONTEND_URL } })

  io.on("connection", (socket) => {
    socket.on("watch", async (tableId: string, ack?: () => void) => {
      await socket.join(tableId)
      ack?.()
    })
    // TODO use the logged in user once auth exists
    socket.on("watchHand", async (info: { tableId: string; userId: string }, ack?: () => void) => {
      socket.data.userId = info.userId
      await socket.join(handRoom(info.tableId))
      const view = getTableView(info.tableId, info.userId)
      if (view) socket.emit("view", view)
      ack?.()
    })
    socket.on("watchLobby", async (ack?: () => void) => {
      await socket.join(LOBBY)
      ack?.()
    })
    registerChat(socket, broadcastChat) // passed in so chat.ts doesn't import io.ts (avoids a circular import)
  })
}

/* BROADCASTS */

/* sends the latest table and lobby state to watchers */
export async function broadcastChange(tableId: string) {
  if (!io) return
  const table = await getTable(tableId)
  if (table) io.to(tableId).emit("table", table)
  io.to(LOBBY).emit("tables", await getAllTables())
}

/* sends the latest game state to watchers */
export async function sendViews(tableId: string) {
  if (!io) return
  const sockets = await io.in(handRoom(tableId)).fetchSockets()
  for (const socket of sockets) {
    socket.emit("view", getTableView(tableId, socket.data.userId))
  }
}

/* sends a new chat message to everyone in that table's chat */
export function broadcastChat(message: ChatMessage) {
  io?.to(chatRoom(message.tableId)).emit("chat:message", message)
}

/* HELPERS */

function handRoom(tableId: string) {
  return `hand:${tableId}`
}