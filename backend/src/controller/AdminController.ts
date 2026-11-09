import { Request, Response } from "express"
import { getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers } from "../dao/UserDAO"

export async function listPlayers(_req: Request, res: Response) {
  res.json(await getAllPlayers())
}

export async function listPlayerHands(req: Request<{ id: string }>, res: Response) {
  res.json(await getPlayerHands(req.params.id))
}
