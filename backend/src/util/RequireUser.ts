import { NextFunction, Request, Response } from "express"
import { getUserIdFromToken } from "../dao/UserDAO"

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  const userId = token ? await getUserIdFromToken(token) : null
  if (!userId) {
    res.status(401).json({ error: "Not signed in" })
    return
  }
  res.locals.userId = userId
  next()
}
