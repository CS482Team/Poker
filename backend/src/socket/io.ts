import type { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { getAllTables, getTable } from "../dao/TableDAO"

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
    socket.on("watchLobby", async (ack?: () => void) => {
      await socket.join(LOBBY)
      ack?.()
    })
  })
}

/* sends the latest table and lobby state to watchers */
export async function broadcastChange(tableId: string) {
  if (!io) return
  const table = await getTable(tableId)
  if (table) io.to(tableId).emit("table", table)
  io.to(LOBBY).emit("tables", await getAllTables())
}
