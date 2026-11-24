import { getSupabase } from "../config/Supabase"

/* rows in public.friendship: one per pair. status 0 = pending (sender asked receiver), 1 = accepted */
export const PENDING = 0
export const ACCEPTED = 1

export interface PlayerRow {
  id: string
  username: string
  avatar_url: string | null
}

export interface FriendshipRow {
  sender_id: string
  receiver_id: string
  status: number
  created_at: string
  sender: PlayerRow
  receiver: PlayerRow
}

export interface FoundPlayer {
  id: string
  username: string
  avatarUrl: string | null
  isGuest: boolean
}

const PLAYER = "id, username, avatar_url"

/* a filter for the row between two players, in either direction. Both ids must be trusted uuids
   (the signed-in player's id, or one the controller checked), since they go into the filter text. */
function between(a: string, b: string) {
  return `and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`
}

/* the player with this username, ignoring case (an exact match wins); null if there isn't one */
export async function findPlayerByUsername(username: string): Promise<FoundPlayer | null> {
  const pattern = username.replace(/[\\%_]/g, (c) => `\\${c}`)
  const { data, error } = await getSupabase().from("user").select("id, username, avatar_url, is_guest").ilike("username", pattern).limit(2)
  if (error) throw error
  const rows = data as (PlayerRow & { is_guest: boolean })[]
  const row = rows.find((r) => r.username === username) ?? (rows.length === 1 ? rows[0] : undefined)
  return row ? { id: row.id, username: row.username, avatarUrl: row.avatar_url, isGuest: row.is_guest } : null
}

/* every friendship and request a player is part of, with both players' names and pictures */
export async function getFriendships(userId: string): Promise<FriendshipRow[]> {
  const { data, error } = await getSupabase()
    .from("friendship")
    .select(`sender_id, receiver_id, status, created_at, sender:user!friendship_sender_id_fkey(${PLAYER}), receiver:user!friendship_receiver_id_fkey(${PLAYER})`)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  if (error) throw error
  return data as unknown as FriendshipRow[]
}

/* the friendship or request between two players, whoever sent it; null if there's none */
export async function getFriendship(a: string, b: string): Promise<{ senderId: string; status: number } | null> {
  const { data, error } = await getSupabase().from("friendship").select("sender_id, status").or(between(a, b)).maybeSingle()
  if (error) throw error
  return data ? { senderId: data.sender_id, status: data.status } : null
}

/* sends a request; false if a row between them already exists (e.g. both asked at the same moment) */
export async function insertRequest(senderId: string, receiverId: string): Promise<boolean> {
  const { error } = await getSupabase().from("friendship").insert({ sender_id: senderId, receiver_id: receiverId, status: PENDING })
  if (error?.code === "23505") return false
  if (error) throw error
  return true
}

/* accepts the request `senderId` sent `receiverId`; false if there's no such pending request */
export async function acceptRequest(senderId: string, receiverId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("friendship")
    .update({ status: ACCEPTED })
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .eq("status", PENDING)
    .select("id")
  if (error) throw error
  return data.length === 1
}

/* removes the friendship or request between two players, whatever its state; false if there was none */
export async function deleteFriendship(a: string, b: string): Promise<boolean> {
  const { data, error } = await getSupabase().from("friendship").delete().or(between(a, b)).select("id")
  if (error) throw error
  return data.length > 0
}

/* where each of these players is seated right now */
export async function getSeatedTables(userIds: string[]): Promise<Map<string, { id: string; name: string }>> {
  const seated = new Map<string, { id: string; name: string }>()
  if (userIds.length === 0) return seated
  const { data, error } = await getSupabase().from("table_players").select("user_id, table:table_id(id, name)").in("user_id", userIds)
  if (error) throw error
  for (const row of data as unknown as { user_id: string; table: { id: string; name: string } | null }[]) {
    if (row.table && !seated.has(row.user_id)) seated.set(row.user_id, row.table)
  }
  return seated
}

/* the other signed-up players in a player's last `hands` hands, most recent first (may repeat; bots and guests left out) */
export async function getRecentOpponents(userId: string, hands: number): Promise<(PlayerRow & { played_at: string })[]> {
  const { data: mine, error } = await getSupabase()
    .from("match_players")
    .select("match_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(hands)
  if (error) throw error
  if (mine.length === 0) return []

  const { data, error: othersError } = await getSupabase()
    .from("match_players")
    .select(`created_at, user!inner(${PLAYER}, is_guest)`)
    .in("match_id", mine.map((m) => m.match_id))
    .neq("user_id", userId)
    .eq("user.is_guest", false)
    .order("created_at", { ascending: false })
  if (othersError) throw othersError
  return (data as unknown as { created_at: string; user: PlayerRow }[]).map((row) => ({
    id: row.user.id,
    username: row.user.username,
    avatar_url: row.user.avatar_url,
    played_at: row.created_at,
  }))
}
