import { getSupabase } from "../config/Supabase"
import type { PlayerSummary } from "../../../shared/PlayerHistory"
import type { MyProfile } from "../../../shared/User"

/* gets a user's chips */
export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await getSupabase().from("user").select("chip_balance").eq("id", userId).single()

  if (error) throw error

  return data.chip_balance
}

/* gets a user's display name */
export async function getUsername(userId: string): Promise<string> {
  const { data, error } = await getSupabase().from("user").select("username").eq("id", userId).single()

  if (error) throw error

  return data.username
}

/* saves a user's new chip total */
export async function setBalance(userId: string, balance: number): Promise<void> {
  const { error } = await getSupabase().from("user").update({ chip_balance: balance }).eq("id", userId)

  if (error) throw error
}

export async function getRole(userId: string): Promise<number> {
  const { data, error } = await getSupabase().from("user").select("role").eq("id", userId).single()

  if (error) throw error

  return data.role
}

export async function getUserIdFromToken(token: string): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser(token)
  const user = data.user
  if (!user || (user.banned_until && new Date(user.banned_until) > new Date())) return null

  return user.id
}

export async function removeUser(userId: string): Promise<void> {
  const { error } = await getSupabase().auth.admin.updateUserById(userId, { ban_duration: "876000h" })
  if (error) throw error
  const { error: dbError } = await getSupabase().from("user").update({ banned: true }).eq("id", userId)
  if (dbError) throw dbError
}

export async function getProfile(userId: string): Promise<MyProfile> {
  const { data, error } = await getSupabase().from("user").select("id, username, avatar_url, is_guest").eq("id", userId).single()

  if (error) throw error

  return { id: userId, username: data.username, avatarUrl: data.avatar_url, email: "", isGuest: data.is_guest }
}

export async function setUsername(userId: string, username: string): Promise<boolean> {
  const { error } = await getSupabase().from("user").update({ username }).eq("id", userId)

  if (error?.code === "23505") return false
  if (error) throw error

  return true
}

export async function setAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
  const { error } = await getSupabase().from("user").update({ avatar_url: avatarUrl }).eq("id", userId)

  if (error) throw error
}

export async function getAllPlayers(): Promise<PlayerSummary[]> {
  const { data, error } = await getSupabase()
    .from("user")
    .select("id, username, chip_balance, banned, match_players(count)")
    .eq("role", 0)
    .order("username")

  if (error) throw error

  return data.map((row: any) => ({
    id: row.id,
    username: row.username,
    balance: row.chip_balance,
    handsPlayed: row.match_players[0]?.count ?? 0,
    banned: row.banned,
  }))
}

export async function getDailyReward(userId: string): Promise<{ lastClaimAt: string | null; streak: number }> {
  const { data, error } = await getSupabase().from("user").select("last_daily_reward_at, current_streak").eq("id", userId).single()

  if (error) throw error

  return { lastClaimAt: data.last_daily_reward_at, streak: data.current_streak }
}

export async function recordDailyClaim(userId: string, previous: string | null, now: Date, day: number): Promise<boolean> {
  let query = getSupabase().from("user").update({ last_daily_reward_at: now.toISOString(), current_streak: day }).eq("id", userId)
  query = previous ? query.eq("last_daily_reward_at", previous) : query.is("last_daily_reward_at", null)
  const { data, error } = await query.select("id")

  if (error) throw error

  return data.length === 1
}

export async function unbanUser(userId: string): Promise<void> {
  const { error } = await getSupabase().auth.admin.updateUserById(userId, { ban_duration: "none" })
  if (error) throw error
  const { error: dbError } = await getSupabase().from("user").update({ banned: false }).eq("id", userId)
  if (dbError) throw dbError
}

/* a leaderboard player's chips, or null if they can't be ranked (a guest, an admin, or no such user) */
export async function getRankableBalance(userId: string): Promise<number | null> {
  const { data, error } = await getSupabase().from("user").select("chip_balance, is_guest, role").eq("id", userId).maybeSingle()
  if (error) throw error
  return data && !data.is_guest && data.role === 0 ? data.chip_balance : null
}
