import type { ChatMessage } from "../../../shared/Chat"
import { getSupabase } from "../config/Supabase"

const COLUMNS = "id, table_id, user_id, body, created_at, user(username, avatar_url)"

type ChatRow = {
  id: number
  table_id: string
  user_id: string | null
  body: string
  created_at: string
  user: { username: string; avatar_url: string | null } | null
}

/* saves a message, a null user means a system message */
export async function insertMessage(tableId: string, userId: string | null, body: string): Promise<ChatMessage> {
  const { data, error } = await getSupabase()
    .from("chat_message")
    .insert({ table_id: tableId, user_id: userId, body })
    .select(COLUMNS)
    .single()

  if (error) throw error

  // Supabase can't type the joined user(...) columns, so we cast to our row shape
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

  // newest first uses the (table_id, id DESC) index; reverse so the chat reads top to bottom
  return (data as unknown as ChatRow[]).map(toMessage).reverse()
}

function toMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    tableId: row.table_id,
    userId: row.user_id,
    name: row.user?.username ?? null,
    avatarUrl: row.user?.avatar_url ?? null,
    body: row.body,
    createdAt: row.created_at,
  }
}
