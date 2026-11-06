import type { ChatMessage } from "../../../shared/Chat"
import { getSupabase } from "../config/Supabase"

const COLUMNS = "id, table_id, user_id, body, created_at, user(username)"

type ChatRow = {
  id: number
  table_id: string
  user_id: string | null
  body: string
  created_at: string
  user: { username: string } | null
}

/* saves a message, a null user means a system message */
export async function insertMessage(tableId: string, userId: string | null, body: string): Promise<ChatMessage> {
  const { data, error } = await getSupabase()
    .from("chat_message")
    .insert({ table_id: tableId, user_id: userId, body })
    .select(COLUMNS)
    .single()

  if (error) throw error

  return toMessage(data as unknown as ChatRow)
}

/* gets a table's latest messages, oldest first */
export async function recentMessages(tableId: string, limit: number): Promise<ChatMessage[]> {
  const { data, error } = await getSupabase()
    .from("chat_message")
    .select(COLUMNS)
    .eq("table_id", tableId)
    .order("id", { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data as unknown as ChatRow[]).map(toMessage).reverse()
}

function toMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    tableId: row.table_id,
    userId: row.user_id,
    name: row.user?.username ?? null,
    body: row.body,
    createdAt: row.created_at,
  }
}
