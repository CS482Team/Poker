import { Request, Response } from "express"
import { getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers, removeUser, unbanUser } from "../dao/UserDAO"

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
