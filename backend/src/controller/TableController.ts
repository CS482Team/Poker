import { Request, Response } from "express"
import type { NewTable, Table } from "../../../shared/Table"
import { MAX_PLAYERS, MIN_PLAYERS } from "../../../shared/Rules"
import { logBalanceChange } from "../dao/BalanceLogDAO"
import { createTable, deleteTable, getAllTables, getTable } from "../dao/TableDAO"
import { addPlayer, countPlayers, removePlayer } from "../dao/TablePlayersDAO"
import { getBalance, setBalance } from "../dao/UserDAO"
import { endGame, leaveGame, startIfReady } from "../services/GameService"
import { broadcastChange, sendViews } from "../socket/io"
import { sendGame } from "./GameController"

/* handles GET /tables */
export async function listTables(_req: Request, res: Response) {
  const tables = await getAllTables()
  res.json(tables)
}

/* handles GET /tables/:id */
export async function getTableById(req: Request<{ id: string }>, res: Response) {
  const table = await getTable(req.params.id)
  if (!table) {
    res.status(404).json({ error: "Table not found" })
    return
  }
  res.json(table)
}

/* handles POST /tables and tells the lobby */
export async function addTable(req: Request<{}, {}, NewTable>, res: Response) {
  if (!isValidNewTable(req.body)) {
    res.status(400).json({ error: "Invalid table" })
    return
  }
  const id = await createTable({ ...req.body, name: req.body.name.trim() })
  await broadcastChange(id)
  res.status(201).json({ id })
}

/* handles leaving, deletes an empty table and tells watchers */
export async function leaveTable(req: Request<{ id: string; userId: string }>, res: Response) {
  const { id, userId } = req.params
  const game = leaveGame(id, userId)
  const stack = await removePlayer(id, userId)
  const gameStack = game?.players.find((p) => p.id === userId)?.stack
  if (stack !== null) await changeBalance(userId, gameStack ?? stack, "cash_out")
  if ((await countPlayers(id)) === 0) {
    endGame(id)
    await deleteTable(id)
  }
  await broadcastChange(id)
  if (game) sendGame(game)
  res.status(204).end()
}

/* handles joining, seats the user and tells watchers */
export async function joinTable(req: Request<{ id: string }, {}, { userId: string }>, res: Response) {
  const { userId } = req.body
  if (typeof userId !== "string") {
    res.status(400).json({ error: "Invalid user" })
    return
  }
  const table = await getTable(req.params.id)
  if (!table) {
    res.status(404).json({ error: "Table not found" })
    return
  }
  if (table.seats.some((seat) => seat.userId === userId)) { /* Already seated */
    res.status(204).end()
    return
  }
  const seatNumber = firstFreeSeat(table)
  if (seatNumber === -1) {
    res.status(409).json({ error: "Table full" })
    return
  }
  if ((await getBalance(userId)) < table.buyIn) {
    res.status(409).json({ error: "Insufficient balance" })
    return
  }
  await addPlayer(table.id, userId, seatNumber, table.buyIn)
  await changeBalance(userId, -table.buyIn, "buy_in")
  await broadcastChange(table.id)
  await dealIfReady(table.id)
  res.status(204).end()
}

/* HELPER FUNCTIONS */

async function dealIfReady(tableId: string) {
  const playerIds = await startIfReady(tableId)
  if (playerIds) sendViews(tableId, playerIds)
}

/* changes a user's balance and logs it */
async function changeBalance(userId: string, delta: number, reason: string) {
  await setBalance(userId, (await getBalance(userId)) + delta)
  await logBalanceChange(userId, delta, reason)
}

/* finds the lowest empty seat */
function firstFreeSeat(table: Table) {
  const taken = new Set(table.seats.map((seat) => seat.seatNumber))
  for (let seatNumber = 0; seatNumber < table.maxPlayers; seatNumber++) {
    if (!taken.has(seatNumber)) return seatNumber
  }
  return -1
}


/* checks the new table settings */
function isValidNewTable(body: NewTable) {
  return (
    typeof body.hostId === "string" &&
    typeof body.name === "string" &&
    body.name.trim() !== "" &&
    Number.isInteger(body.maxPlayers) &&
    body.maxPlayers >= MIN_PLAYERS &&
    body.maxPlayers <= MAX_PLAYERS &&
    Number.isInteger(body.buyIn) &&
    body.buyIn > 0 &&
    Number.isInteger(body.minimumBet) &&
    body.minimumBet >= 0 &&
    Number.isInteger(body.ante) &&
    body.ante >= 0
  )
}