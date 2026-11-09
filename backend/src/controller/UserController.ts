import { Request, Response } from "express"
import { getBalance, getUsername } from "../dao/UserDAO"

/* handles GET /users/:id/balance */
export async function getUserBalance(req: Request<{ id: string }>, res: Response) {
  const balance = await getBalance(req.params.id)
  res.json({ balance })
}

export async function getUserUsername(req: Request<{ id: string }>, res: Response) {
  const username = await getUsername(req.params.id)
  res.json({ username })
}
