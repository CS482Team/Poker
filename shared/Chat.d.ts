export interface ChatMessage {
  id: number
  tableId: string
  userId: string | null // null means a system message, like "Maya joined the table"
  name: string | null
  body: string
  createdAt: string // ISO 8601 date string
}

export interface ChatSend {
  tableId: string
  userId: string
  body: string
}

export type ChatReply = { ok: true } | { ok: false; error: string }