import type { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { getAllTables, getTable } from "../dao/TableDao"
import type { GameState } from "../../../shared/GameState"
import { getHand } from "../services/Game"

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
      await socket.join(handRoom(info.tableId, info.userId))
      const hand = getHand(info.tableId, info.userId)
      if (hand) socket.emit("hand", hand)
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

export function sendHands(game: GameState) {
  for (const player of game.players) {
    io?.to(handRoom(game.roomId, player.id)).emit("hand", player.hand)
  }
}

function handRoom(tableId: string, userId: string) {
  return `hand:${tableId}:${userId}`
}
