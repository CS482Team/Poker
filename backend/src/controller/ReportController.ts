import { Request, Response } from "express"
import { MAX_REPORT_LENGTH } from "../../../shared/Rules"
import { messagesBefore } from "../dao/ChatDAO"
import { getTableHands } from "../dao/MatchDAO"
import { createReport, getReport, getReports } from "../dao/ReportDAO"
import { getTable } from "../dao/TableDAO"

export async function addReport(req: Request<{}, {}, { message: string; tableId?: string }>, res: Response) {
  const message = typeof req.body.message === "string" ? req.body.message.trim() : ""
  if (message === "" || message.length > MAX_REPORT_LENGTH) {
    res.status(400).json({ error: "Invalid message" })
    return
  }
  const table = typeof req.body.tableId === "string" ? await getTable(req.body.tableId) : null
  await createReport(res.locals.userId, message, table ? { id: table.id, name: table.name } : null)
  res.status(201).end()
}

export async function listReports(_req: Request, res: Response) {
  res.json(await getReports())
}

export async function showReport(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id)
  const report = Number.isInteger(id) ? await getReport(id) : null
  if (!report) {
    res.status(404).json({ error: "Report not found" })
    return
  }
  if (!report.tableId) {
    res.json({ hands: [], chat: [] })
    return
  }
  const [hands, chat] = await Promise.all([getTableHands(report.tableId, report.createdAt), messagesBefore(report.tableId, report.createdAt, 100)])
  res.json({ hands, chat })
}
