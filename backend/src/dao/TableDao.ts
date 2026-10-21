import type { NewTable, Table } from "../../../shared/table"

import { supabase } from "./SupabaseClient"

const TABLE_COLUMNS =
  "id, name, status, variant, max_players, buy_in, minimum_bet, ante, table_players(user_id, seat_number, stack, user(username))"

/* gets every table with its seats */
export async function getAllTables(): Promise<Table[]> {
  const { data, error } = await supabase.from("table").select(TABLE_COLUMNS).order("created_at", { ascending: false })

  if (error) throw error

  return data.map(toTable)
}

/* gets one table and its seats */
export async function getTable(id: string): Promise<Table | null> {
  const { data, error } = await supabase.from("table").select(TABLE_COLUMNS).eq("id", id).maybeSingle()

  if (error) throw error

  return data ? toTable(data) : null
}

function toTable(row: any): Table {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    variant: row.variant,
    maxPlayers: row.max_players,
    buyIn: row.buy_in,
    minimumBet: row.minimum_bet,
    ante: row.ante,
    seats: row.table_players.map((p: any) => ({
      userId: p.user_id,
      username: p.user.username,
      seatNumber: p.seat_number,
      stack: p.stack,
    })),
  }
}

/* saves a new table with its host */
export async function createTable(input: NewTable): Promise<string> {
  const { data, error } = await supabase
    .from("table")
    .insert({
      name: input.name,
      max_players: input.maxPlayers,
      buy_in: input.buyIn,
      minimum_bet: input.minimumBet,
      ante: input.ante,
      host_id: input.hostId,
    })
    .select("id")
    .single()

  if (error) throw error

  return data.id
}

/* removes a table */
export async function deleteTable(id: string): Promise<void> {
  const { error } = await supabase.from("table").delete().eq("id", id)

  if (error) throw error
}
