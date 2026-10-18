import { Request, Response } from "express"
import { getAllTables, getTable } from "../db/TableDAO"

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
