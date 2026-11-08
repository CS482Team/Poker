import { NextFunction, Request, Response } from "express"
import { getRole } from "../dao/UserDAO"

const ADMIN_ROLE = 1

export async function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if ((await getRole(res.locals.userId)) !== ADMIN_ROLE) {
    res.status(403).json({ error: "Admins only" })
    return
  }
  next()
}
