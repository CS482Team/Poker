import { NextFunction, Request, Response } from "express"
import { getRole, getUserIdFromToken } from "../dao/UserDAO"

const ADMIN_ROLE = 1

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  const userId = token ? await getUserIdFromToken(token) : null
  if (!userId) {
    res.status(401).json({ error: "Not signed in" })
    return
  }
  if ((await getRole(userId)) !== ADMIN_ROLE) {
    res.status(403).json({ error: "Admins only" })
    return
  }
  res.locals.userId = userId
  next()
}
