import { Request, Response } from "express"
import { getSupabase } from "../config/Supabase"
import { getPlayerHands } from "../dao/MatchDAO"
import { getBalance, getUsername, setUsername, getProfile, setAvatarUrl } from "../dao/UserDAO"
import { getEmail, setEmail, checkPassword } from "../dao/AuthDAO"

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
    res.status(500).json({ error: "Could not load hands" })
  }
}

export async function getUserUsername(req: Request<{ id: string }>, res: Response) {
  const username = await getUsername(req.params.id)
  res.json({ username })
}

/* handles GET /users/me */
export async function getMe(_req: Request, res: Response) {
  const userId = res.locals.userId
  const [profile, email] = await Promise.all([getProfile(userId), getEmail(userId)])
  res.json({ userId, ...profile, email })
}

/* handles PATCH /users/me/username */
export async function changeUsername(req: Request<{}, {}, { username: string }>, res: Response) {
  const username = typeof req.body.username === "string" ? req.body.username.trim() : ""
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: "Usernames are 3 to 20 characters" })
    return
  }
  if (!(await setUsername(res.locals.userId, username))) {
    res.status(409).json({ error: "That username is taken" })
    return
  }
  res.status(204).end()
}

/* handles PATCH /users/me/avatar */
export async function changeAvatar(req: Request<{}, {}, { avatarUrl: string | null }>, res: Response) {
  const { avatarUrl } = req.body
  if (avatarUrl !== null && !isWebUrl(avatarUrl)) {
    res.status(400).json({ error: "Enter a link that starts with https://" })
    return
  }
  await setAvatarUrl(res.locals.userId, avatarUrl)
  res.status(204).end()
}

/* handles PATCH /users/me/email: the current password first, then the new email */
export async function changeEmail(req: Request<{}, {}, { password: string; email: string }>, res: Response) {
  const { password, email } = req.body
  if (typeof password !== "string" || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Enter your password and a new email" })
    return
  }
  const current = await getEmail(res.locals.userId)
  if (!current || !(await checkPassword(current, password))) {
    res.status(403).json({ error: "That password isn't right" })
    return
  }
  if (!(await setEmail(res.locals.userId, email.trim().toLowerCase()))) {
    res.status(409).json({ error: "Another account already uses that email" })
    return
  }
  res.status(204).end()
}

function isWebUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}