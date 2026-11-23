import { getSupabase } from "../config/Supabase"
import type { Card } from "../../../shared/Card"
import type { HandRecord } from "../../../shared/PlayerHistory"
import type { ReportHand } from "../../../shared/Report"

export interface NewMatch { tableId: string; tableName: string; matchNumber: number; pot: number; dealerSeat: number }
export interface NewMatchPlayer { seatNumber: number; userId: string | null; botName: string | null; dealt: Card[] }
export interface MatchResult { seatNumber: number; netResult: number; handRank: string | null; dealt: Card[]; final: Card[] }
export interface MatchAction { matchId: string; seatNumber: number; userId: string | null; type: string; amount: number; cardsDiscarded: number | null }

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
    .insert(players.map(p => ({ match_id: matchId, seat_number: p.seatNumber, user_id: p.userId, bot_name: p.botName, hand_history: { dealt: p.dealt } })))
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
      .update({ net_result: r.netResult, hand_rank: r.handRank, hand_history: { dealt: r.dealt, final: r.final } })
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

export async function insertMatchAction(a: MatchAction): Promise<void> {
  const { error } = await getSupabase()
    .from("match_log")
    .insert({ match_id: a.matchId, seat_number: a.seatNumber, user_id: a.userId, action_type: a.type, amount: a.amount, cards_discarded: a.cardsDiscarded })
  if (error) throw error
}

const HAND_COLUMNS = "id, match_number, pot, ended_at, match_players(seat_number, bot_name, net_result, hand_rank, hand_history, user(username)), match_log(seat_number, action_type, amount, cards_discarded, created_at)"

export async function getTableHands(tableId: string, before: string): Promise<ReportHand[]> {
  const { data, error } = await getSupabase()
    .from("match")
    .select(HAND_COLUMNS)
    .eq("table_id", tableId)
    .lte("started_at", before)
    .order("started_at", { ascending: false })
    .limit(10)
  if (error) throw error
  return data.map(toHand)
}

export async function getHand(matchId: string): Promise<ReportHand | null> {
  const { data, error } = await getSupabase().from("match").select(HAND_COLUMNS).eq("id", matchId).maybeSingle()
  if (error) throw error
  return data ? toHand(data) : null
}

function toHand(row: any): ReportHand {
  return {
    id: row.id,
    handNumber: row.match_number,
    pot: row.pot,
    endedAt: row.ended_at,
    players: row.match_players
      .sort((a: any, b: any) => a.seat_number - b.seat_number)
      .map((p: any) => ({
        seat: p.seat_number,
        name: p.user?.username ?? p.bot_name ?? "Unknown",
        dealt: p.hand_history?.dealt ?? [],
        final: p.hand_history?.final ?? null,
        handRank: p.hand_rank,
        netResult: p.net_result,
      })),
    actions: row.match_log
      .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
      .map((a: any) => ({ seat: a.seat_number, type: a.action_type, amount: a.amount, cardsDiscarded: a.cards_discarded })),
  }
}
