import type { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { getAllTables, getTable } from "../dao/TableDAO"
import { getTableView } from "../services/GameService"

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
      await socket.join(handTable(info.tableId, info.userId))
      const view = getTableView(info.tableId, info.userId)
      if (view) socket.emit("view", view)
      ack?.()
    })
    socket.on("watchLobby", async (ack?: () => void) => {
      await socket.join(LOBBY)
      ack?.()
    })
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
export function sendViews(tableId: string, userIds: string[]) {
  for (const id of userIds) {
    const view = getTableView(tableId, id)
    if (view) io?.to(handTable(tableId, id)).emit("view", view)
  }
}

/* HELPERS */

function handTable(tableId: string, userId: string) {
  return `hand:${tableId}:${userId}`
}
