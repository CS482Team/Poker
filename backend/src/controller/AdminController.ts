import { Request, Response } from "express"
import { getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers, removeUser, setBalance, unbanUser } from "../dao/UserDAO"

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
