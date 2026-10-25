import { getSupabase } from "../config/Supabase"

/* seats a player at a table */
export async function addPlayer(tableId: string, userId: string, seatNumber: number, stack: number): Promise<void> {
  const { error } = await getSupabase()
    .from("table_players")
    .insert({ table_id: tableId, user_id: userId, seat_number: seatNumber, stack })

  if (error) throw error
}

/* unseats a player */
export async function removePlayer(tableId: string, userId: string): Promise<number | null> {
  const { data, error } = await getSupabase()
    .from("table_players")
    .select("stack")
    .eq("table_id", tableId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { error: deleteError } = await getSupabase().from("table_players").delete().eq("table_id", tableId).eq("user_id", userId)

  if (deleteError) throw deleteError

  return data.stack
}

/* counts the players seated at a table */
export async function countPlayers(tableId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("table_players")
    .select("*", { count: "exact", head: true })
    .eq("table_id", tableId)

  if (error) throw error

  return count ?? 0
}
