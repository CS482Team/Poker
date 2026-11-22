import { Request, Response } from "express"
import { getHand, getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers } from "../dao/UserDAO"

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
