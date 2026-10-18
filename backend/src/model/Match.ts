import { getSupabase } from "../config/Supabase"

export interface NewMatch { tableId: string; matchNumber: number; pot: number; dealerSeat: number }
export interface NewMatchPlayer { seatNumber: number; userId: string | null; botName: string | null }

// Saves a new match (one hand) and returns its id
export async function insertMatch(m: NewMatch): Promise<string> {
  const { data, error } = await getSupabase()
    .from("match")
    .insert({ table_id: m.tableId, match_number: m.matchNumber, pot: m.pot, dealer_seat: m.dealerSeat })
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