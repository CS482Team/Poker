import type { Table } from "@shared/Table"
import type { PlayerView } from "@shared/PlayerView"
import { io } from "socket.io-client"

/* opens one socket, joins its rooms and handles their events */
function listen(joins: [string, unknown][], handlers: Record<string, (data: any) => void>) {
  const socket = io(process.env.NEXT_PUBLIC_API_URL)
  socket.on("connect", () => joins.forEach(([event, payload]) => socket.emit(event, payload)))
  for (const [event, handler] of Object.entries(handlers)) socket.on(event, handler)
  return () => {
    socket.disconnect()
  }
}

/* gives live updates for one table and this user's view of its game */
export function watchTable(tableId: string, userId: string, onTable: (table: Table) => void, onView: (view: PlayerView) => void) {
  return listen([["watch", tableId], ["watchHand", { tableId, userId }]], { table: onTable, view: onView })
}

/* gives live updates for the table list */
export function watchTables(onTables: (tables: Table[]) => void) {
  return listen([["watchLobby", undefined]], { tables: onTables })
}
