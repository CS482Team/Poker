import type { Report } from "../../../shared/Report"
import { getSupabase } from "../config/Supabase"

const COLUMNS = "id, user_id, kind, status, body, created_at, table_id, table_name, user(username)"

export async function createReport(userId: string, body: string, table: { id: string; name: string } | null, kind = "report"): Promise<void> {
  const { error } = await getSupabase()
    .from("support_ticket")
    .insert({ user_id: userId, body, table_id: table?.id ?? null, table_name: table?.name ?? null, kind })

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

export async function hasOpenReset(userId: string): Promise<boolean> {
  const { count, error } = await getSupabase().from("support_ticket").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("kind", "password_reset").eq("status", "open")
  if (error) throw error
  return (count ?? 0) > 0
}

export async function resolveReport(id: number): Promise<void> {
  const { error } = await getSupabase().from("support_ticket").update({ status: "resolved" }).eq("id", id)
  if (error) throw error
}

function toReport(row: any): Report {
  return {
    id: row.id,
    username: row.user?.username ?? null,
    body: row.body,
    createdAt: row.created_at,
    tableId: row.table_id,
    tableName: row.table_name,
    userId: row.user_id,
    kind: row.kind,
    status: row.status,
  }
}
