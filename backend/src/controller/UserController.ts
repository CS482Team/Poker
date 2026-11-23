import { Request, Response } from "express"
import { getSupabase } from "../config/Supabase"
import { getPlayerHands } from "../dao/MatchDAO"
import { getBalance, getDailyReward, getUsername, recordDailyClaim, setBalance } from "../dao/UserDAO"
import { logBalanceChange } from "../dao/BalanceLogDAO"
import { dailyRewardStatus } from "../services/DailyReward"
import { DAILY_REWARDS } from "../../../shared/Rules"


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
