import { Request, Response } from "express"
import type { NewTable, TableDetail } from "../../../shared/table"
import { addPlayer, countPlayers, createTable, deleteTable, getAllTables, getTable, removePlayer } from "../db/TableDAO"

export async function listTables(_req: Request, res: Response) {
  const tables = await getAllTables()
  res.json(tables)
}

export async function getTableById(req: Request<{ id: string }>, res: Response) {
  const table = await getTable(req.params.id)
  if (!table) {
    res.status(404).json({ error: "Table not found" })
    return
  }
  res.json(table)
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6

function isValidNewTable(body: NewTable) {
  return (
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

export async function addTable(req: Request<{}, {}, NewTable>, res: Response) {
  if (!isValidNewTable(req.body)) {
    res.status(400).json({ error: "Invalid table" })
    return
  }
  const id = await createTable({ ...req.body, name: req.body.name.trim() })
  res.status(201).json({ id })
}

export async function leaveTable(req: Request<{ id: string; userId: string }>, res: Response) {
  const { id, userId } = req.params
  await removePlayer(id, userId)
  if ((await countPlayers(id)) === 0) await deleteTable(id)
  res.status(204).end()
}

function firstFreeSeat(table: TableDetail) {
  const taken = new Set(table.seats.map((seat) => seat.seatNumber))
  for (let seatNumber = 0; seatNumber < table.maxPlayers; seatNumber++) {
    if (!taken.has(seatNumber)) return seatNumber
  }
  return -1
}

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
  if (table.seats.some((seat) => seat.userId === userId)) {
    res.status(204).end()
    return
  }
  const seatNumber = firstFreeSeat(table)
  if (seatNumber === -1) {
    res.status(409).json({ error: "Table full" })
    return
  }
  await addPlayer(table.id, userId, seatNumber, table.buyIn)
  res.status(204).end()
}
