import { Request, Response } from "express"
import { getHand, getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers } from "../dao/UserDAO"
import { getEmail } from "../dao/AuthDAO"
import { getReport } from "../dao/ReportDAO"

export async function listPlayers(_req: Request, res: Response) {
  res.json(await getAllPlayers())
}

export async function listPlayerHands(req: Request<{ id: string }>, res: Response) {
  res.json(await getPlayerHands(req.params.id))
}

export async function showHand(req: Request<{ id: string }>, res: Response) {
  const hand = await getHand(req.params.id)
  if (!hand) {
    res.status(404).json({ error: "Hand not found" })
    return
  }
  res.json(hand)
}

export async function resetPassword(req: Request<{ id: string }, {}, { password: string }>, res: Response) {
  const id = Number(req.params.id)
  const report = Number.isInteger(id) ? await getReport(id) : null
  if (!report || report.kind !== "password_reset" || !report.userId) {
    res.status(404).json({ error: "Reset request not found" })
    return
  }
  const { password } = req.body
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Passwords are at least 6 characters" })
    return
  }
  await setPassword(report.userId, password)
  await resolveReport(id)
  res.json({ email: await getEmail(report.userId) })
}
