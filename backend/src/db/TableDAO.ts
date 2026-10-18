import { createClient } from "@supabase/supabase-js"
import type { NewTable, Table, TableDetail } from "../../../shared/table"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function getAllTables(): Promise<Table[]> {
  const { data, error } = await supabase
    .from("table")
    .select("id, name, status, variant, buy_in, minimum_bet, ante, max_players, bot_count, table_players(count)")
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    variant: row.variant,
    buyIn: row.buy_in,
    minimumBet: row.minimum_bet,
    ante: row.ante,
    maxPlayers: row.max_players,
    players: (row.table_players[0]?.count ?? 0) + row.bot_count,
  }))
}

export async function getTable(id: string): Promise<TableDetail | null> {
  const { data, error } = await supabase
    .from("table")
    .select("id, name, max_players, buy_in, table_players(user_id, seat_number, stack, user(username))")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    maxPlayers: data.max_players,
    buyIn: data.buy_in,
    seats: data.table_players.map((row: any) => ({
      userId: row.user_id,
      username: row.user.username,
      seatNumber: row.seat_number,
      stack: row.stack,
    })),
  }
}

export async function createTable(input: NewTable): Promise<string> {
  const { data, error } = await supabase
    .from("table")
    .insert({
      name: input.name,
      max_players: input.maxPlayers,
      buy_in: input.buyIn,
      minimum_bet: input.minimumBet,
      ante: input.ante,
    })
    .select("id")
    .single()

  if (error) throw error

  return data.id
}

export async function removePlayer(tableId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("table_players").delete().eq("table_id", tableId).eq("user_id", userId)

  if (error) throw error
}

export async function countPlayers(tableId: string): Promise<number> {
  const { count, error } = await supabase
    .from("table_players")
    .select("*", { count: "exact", head: true })
    .eq("table_id", tableId)

  if (error) throw error

  return count ?? 0
}

export async function deleteTable(id: string): Promise<void> {
  const { error } = await supabase.from("table").delete().eq("id", id)

  if (error) throw error
}

export async function addPlayer(tableId: string, userId: string, seatNumber: number, stack: number): Promise<void> {
  const { error } = await supabase
    .from("table_players")
    .insert({ table_id: tableId, user_id: userId, seat_number: seatNumber, stack })

  if (error) throw error
}
