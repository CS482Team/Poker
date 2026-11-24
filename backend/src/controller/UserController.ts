import { Request, Response } from "express"
import { getSupabase } from "../config/Supabase"
import { getPlayerHands } from "../dao/MatchDAO"
import { getBalance, getDailyReward, getProfile, getUserIdFromToken, getUsername, recordDailyClaim, setAvatarUrl, setBalance, setUsername } from "../dao/UserDAO"
import { getEmail, setEmail, checkPassword } from "../dao/AuthDAO"
import { logBalanceChange } from "../dao/BalanceLogDAO"
import { RateLimiter } from "../socket/RateLimiter"
import { dailyRewardStatus } from "../services/DailyReward"
import { DAILY_REWARDS, LEADERBOARD_TIMEFRAMES } from "../../../shared/Rules"
import { getLeaderboard } from "../services/LeaderboardService"
import type { Timeframe } from "../../../shared/Leaderboard"


// password guesses on the email change: 5 per 15 minutes per player (requirement 6)
export const emailAttempts = new RateLimiter(5, 15 * 60_000)


export async function getMyBalance(_req: Request, res: Response) {
  res.json({ balance: await getBalance(res.locals.userId) })
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
  if (avatarUrl !== null && !isImageUpload(avatarUrl) && !isWebUrl(avatarUrl)) {
    res.status(400).json({ error: "Pick an image under 1 MB, or a link that starts with https://" })
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
  if (!current) {
     res.status(403).json({ error: "Guest accounts don't have an email to change" })
     return
   }
   if (!emailAttempts.allow(res.locals.userId)) {
     res.status(429).json({ error: "Too many tries. Wait a few minutes and try again" })
     return
   }
   if (!(await checkPassword(current, password))) {
    res.status(403).json({ error: "That password isn't right" })
    return
  }
  if (!(await setEmail(res.locals.userId, email.trim().toLowerCase()))) {
    res.status(409).json({ error: "Another account already uses that email" })
    return
  }
  res.status(204).end()
}

/* a picture from ImagePicker: a data: URL for an image, under about 1 MB */
function isImageUpload(value: unknown) {
   return typeof value === "string" && value.length <= 1_400_000 && /^data:image\/(png|jpeg|gif|webp);base64,/.test(value)
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

export async function getDailyRewardStatus(_req: Request, res: Response) {
  const { lastClaimAt, streak } = await getDailyReward(res.locals.userId)
  res.json(dailyRewardStatus(lastClaimAt ? new Date(lastClaimAt) : null, streak, new Date()))
}

export async function claimDailyReward(_req: Request, res: Response) {
  const userId = res.locals.userId
  const now = new Date()
  const { lastClaimAt, streak } = await getDailyReward(userId)
  const status = dailyRewardStatus(lastClaimAt ? new Date(lastClaimAt) : null, streak, now)
  if (!status.canClaim || !(await recordDailyClaim(userId, lastClaimAt, now, status.day))) {
    res.status(409).json({ error: "You've already claimed today's reward" })
    return
  }
  const reward = DAILY_REWARDS[status.day - 1]!
  const balance = (await getBalance(userId)) + reward
  await setBalance(userId, balance)
  await logBalanceChange(userId, reward, "daily_reward")
  res.json({ day: status.day, reward, balance })
}

/* handles GET /users/leaderboard?timeframe=week|month|season|all (week if left out);
   anyone can see it, and a signed-in player also gets their own standing */
export async function getLeaderboardController(req: Request, res: Response) {
  const timeframe = req.query.timeframe ?? "week"
  if (!isTimeframe(timeframe)) {
    res.status(400).json({ error: "Invalid timeframe" })
    return
  }
  const token = req.headers.authorization?.replace("Bearer ", "")
  try {
    const userId = token ? await getUserIdFromToken(token) : null
    res.json(await getLeaderboard(timeframe, userId))
  } catch (err) {
    console.error("getLeaderboard failed:", err)
    res.status(500).json({ error: "Could not load leaderboard" })
  }
}

function isTimeframe(value: unknown): value is Timeframe {
  return LEADERBOARD_TIMEFRAMES.includes(value as Timeframe)
}
