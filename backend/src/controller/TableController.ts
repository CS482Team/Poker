import { Request, Response } from "express"
import type { NewTable } from "../../../shared/table"
import { createTable, getAllTables, getTable } from "../db/TableDAO"

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
