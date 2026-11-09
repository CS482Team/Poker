import { Request, Response } from "express"
import { getSupabase } from "../config/Supabase"
import { getPlayerHands } from "../dao/MatchDAO"
import { getBalance } from "../dao/UserDAO"

/* handles GET /users/:id/balance */
export async function getUserBalance(req: Request<{ id: string }>, res: Response) {
  const balance = await getBalance(req.params.id)
  res.json({ balance })
}

/* handles GET /users/me/hands, the signed-in user's own history */
export async function getMyHandsHistory(req: Request, res: Response) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const { data, error } = await getSupabase().auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  try {                                                       
    res.json(await getPlayerHands(data.user.id))
  } catch (err) {                                            
    console.error("getPlayerHands failed:", err)
    res.status(500).json({ error: String((err as Error).message ?? err) })
  }
}

