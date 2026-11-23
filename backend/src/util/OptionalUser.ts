/* like requireUser, but guests (or an expired token) carry on with userId null */
import type { NextFunction, Request, Response } from "express"
import { getUserIdFromToken } from "../dao/UserDAO"

export async function optionalUser(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  res.locals.userId = token ? await getUserIdFromToken(token) : null
  next()
}
