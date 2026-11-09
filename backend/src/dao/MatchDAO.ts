import { getSupabase } from "../config/Supabase"
import type { HandRecord } from "../../../shared/PlayerHistory"

export interface NewMatch { tableId: string; tableName: string; matchNumber: number; pot: number; dealerSeat: number }
export interface NewMatchPlayer { seatNumber: number; userId: string | null; botName: string | null }
export interface MatchResult { seatNumber: number; netResult: number }

// Saves a new match (one hand) and returns its id
export async function insertMatch(m: NewMatch): Promise<string> {
  const { data, error } = await getSupabase()
    .from("match")
    .insert({ table_id: m.tableId, table_name: m.tableName, match_number: m.matchNumber, pot: m.pot, dealer_seat: m.dealerSeat })
    .select("id")
    .single()
  if (error) throw error
  return data.id
}

// Saves who is seated in the match; bots have no user id, only a name
export async function insertMatchPlayers(matchId: string, players: NewMatchPlayer[]): Promise<void> {
  const { error } = await getSupabase()
    .from("match_players")
    .insert(players.map(p => ({ match_id: matchId, seat_number: p.seatNumber, user_id: p.userId, bot_name: p.botName })))
  if (error) throw error
}

// Next match number for a table: one more than its highest so far (1 for a new table)
export async function nextMatchNumber(tableId: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("match")
    .select("match_number")
    .eq("table_id", tableId)
    .order("match_number", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data?.match_number ?? 0) + 1
}

export async function finishMatch(matchId: string, winnerId: string | null, pot: number, results: MatchResult[]): Promise<void> {
  const { error } = await getSupabase()
    .from("match")
    .update({ winner_id: winnerId, pot, ended_at: new Date().toISOString() })
    .eq("id", matchId)
  if (error) throw error
  for (const r of results) {
    const { error } = await getSupabase()
      .from("match_players")
      .update({ net_result: r.netResult })
      .eq("match_id", matchId)
      .eq("seat_number", r.seatNumber)
    if (error) throw error
  }
}

export async function getPlayerHands(userId: string): Promise<HandRecord[]> {
  const { data, error } = await getSupabase()
    .from("match_players")
    .select("net_result, match(id, table_name, match_number, pot, ended_at, winner:user(username))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
    .filter((row: any) => row.match.ended_at)
    .map((row: any) => ({
      matchId: row.match.id,
      tableName: row.match.table_name,
      handNumber: row.match.match_number,
      pot: row.match.pot,
      winner: row.match.winner?.username ?? null,
      netResult: row.net_result,
      endedAt: row.match.ended_at,
    }))
}
