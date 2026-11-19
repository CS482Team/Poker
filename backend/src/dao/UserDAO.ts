import { getSupabase } from "../config/Supabase"
import type { PlayerSummary } from "../../../shared/PlayerHistory"

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

  return data.user?.id ?? null
}

export async function getProfile(userId: string): Promise<{ username: string; avatarUrl: string | null; isGuest: boolean }> {
  const { data, error } = await getSupabase().from("user").select("username, avatar_url, is_guest").eq("id", userId).single()

  if (error) throw error

  return { username: data.username, avatarUrl: data.avatar_url, isGuest: data.is_guest }
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
    .select("id, username, chip_balance, match_players(count)")
    .eq("role", 0)
    .order("username")

  if (error) throw error

  return data.map((row: any) => ({
    id: row.id,
    username: row.username,
    balance: row.chip_balance,
    handsPlayed: row.match_players[0]?.count ?? 0,
  }))
}
