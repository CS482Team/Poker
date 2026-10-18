import { getSupabase } from "../config/Supabase"

export interface TableRow { id: string; ante: number; minimum_bet: number }

const DEMO_TABLE_NAME = "Demo Table"
const TABLE_COLUMNS = "id, ante, minimum_bet"

// TODO: demo only; real tables come from room creation (S12)
export async function findOrCreateDemoTable(): Promise<TableRow> {
  const found = await getSupabase().from("table").select(TABLE_COLUMNS).eq("name", DEMO_TABLE_NAME).maybeSingle()
  if (found.error) throw found.error
  if (found.data) return found.data

  const created = await getSupabase()
    .from("table")
    .insert({ name: DEMO_TABLE_NAME, buy_in: 100, ante: 1, minimum_bet: 2 })
    .select(TABLE_COLUMNS)
    .single()
  if (created.error) throw created.error
  return created.data
}
