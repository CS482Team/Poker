import { Request, Response } from "express"
import { getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers, removeUser, setBalance, unbanUser } from "../dao/UserDAO"
import { getHand, getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers } from "../dao/UserDAO"
import { getEmail, setPassword } from "../dao/AuthDAO"
import { getReport, resolveReport } from "../dao/ReportDAO"

export async function listPlayers(_req: Request, res: Response) {
  res.json(await getAllPlayers())
}

export async function listPlayerHands(req: Request<{ id: string }>, res: Response) {
  res.json(await getPlayerHands(req.params.id))
}

export async function removePlayer(req: Request<{ id: string }>, res: Response) {
  await removeUser(req.params.id)
  res.status(204).end()
}

export async function unbanPlayer(req: Request<{ id: string }>, res: Response) {
  await unbanUser(req.params.id)
  res.status(204).end()
}

export async function modifyChips(req: Request<{ id: string }, {}, { balance: number }>, res: Response) {
  const balance = req.body.balance
  if (!Number.isInteger(balance) || balance < 0) {
    res.status(400).json({ error: "Invalid balance" })
    return
  }
  await setBalance(req.params.id, balance)
  res.status(204).end()
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
