import type { Table } from "@shared/Table"
import type { PlayerView } from "@shared/PlayerView"
import { io } from "socket.io-client"

/* opens a socket, joins a table and handles one event */
function listen(event: string, onConnect: string, payload: unknown, handler: (data: any) => void) {
  const socket = io(process.env.NEXT_PUBLIC_API_URL)
  socket.on("connect", () => socket.emit(onConnect, payload))
  socket.on(event, handler)
  return () => {
    socket.disconnect()
  }
}

/* gives live updates for one table */
export function watchTable(id: string, onTable: (table: Table) => void) {
  return listen("table", "watch", id, onTable)
}

/* gives live updates for the table list */
export function watchTables(onTables: (tables: Table[]) => void) {
  return listen("tables", "watchLobby", undefined, onTables)
}

export function watchHand(tableId: string, userId: string, onView: (view: PlayerView) => void) {
  return listen("view", "watchHand", { tableId, userId }, onView)
}
