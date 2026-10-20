import type { Table, TableDetail } from "@shared/table"
import { io } from "socket.io-client"

/* opens a socket, joins a room and handles one event */
function listen(event: string, onConnect: string, payload: string | undefined, handler: (data: any) => void) {
  const socket = io(process.env.NEXT_PUBLIC_API_URL)
  socket.on("connect", () => socket.emit(onConnect, payload))
  socket.on(event, handler)
  return () => {
    socket.disconnect()
  }
}

/* gives live updates for one table */
export function watchTable(id: string, onTable: (table: TableDetail) => void) {
  return listen("table", "watch", id, onTable)
}

/* gives live updates for the table list */
export function watchTables(onTables: (tables: Table[]) => void) {
  return listen("tables", "watchLobby", undefined, onTables)
}
