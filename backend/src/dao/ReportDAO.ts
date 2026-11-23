import type { Report } from "../../../shared/Report"
import { getSupabase } from "../config/Supabase"

const COLUMNS = "id, body, created_at, table_id, table_name, user(username)"

export async function createReport(userId: string, body: string, table: { id: string; name: string } | null): Promise<void> {
  const { error } = await getSupabase()
    .from("support_ticket")
    .insert({ user_id: userId, body, table_id: table?.id ?? null, table_name: table?.name ?? null })

  if (error) throw error
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await getSupabase().from("support_ticket").select(COLUMNS).order("id", { ascending: false })

  if (error) throw error

  return data.map(toReport)
}

export async function getReport(id: number): Promise<Report | null> {
  const { data, error } = await getSupabase().from("support_ticket").select(COLUMNS).eq("id", id).maybeSingle()

  if (error) throw error

  return data ? toReport(data) : null
}

function toReport(row: any): Report {
  return {
    id: row.id,
    username: row.user?.username ?? null,
    body: row.body,
    createdAt: row.created_at,
    tableId: row.table_id,
    tableName: row.table_name,
  }
}
