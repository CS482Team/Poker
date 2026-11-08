export interface ChatMessage {
  id: number
  tableId: string
  userId: string | null // null means a system message, like "Maya joined the table"
  name: string | null
  avatarUrl: string | null // the sender's profile picture, null if they have none
  body: string
  createdAt: string // ISO 8601 date string
}

export interface ChatSend {
  tableId: string
  userId: string
  body: string
}

export type ChatReply = { ok: true } | { ok: false; error: string }