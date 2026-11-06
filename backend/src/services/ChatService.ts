import type { ChatMessage } from "../../../shared/Chat"
import { CHAT_HISTORY_SIZE, MAX_CHAT_LENGTH } from "../../../shared/Rules"
import { insertMessage, recentMessages } from "../dao/ChatDAO"
import { isSeated } from "../dao/TablePlayersDAO"

/* a reason a message was refused, safe to show the player */
export class ChatError extends Error {}

/* checks and saves a player's message */
export async function sendMessage(tableId: string, userId: string, body: string): Promise<ChatMessage> {
  const text = typeof body === "string" ? body.trim() : ""
  if (text.length === 0 || text.length > MAX_CHAT_LENGTH) {
    throw new ChatError(`Messages must be 1 to ${MAX_CHAT_LENGTH} characters`)
  }
  if (!(await isSeated(tableId, userId))) throw new ChatError("Only seated players can chat")
  return insertMessage(tableId, userId, text)
}

/* saves a message from the game itself, like someone joining */
export function sendSystemMessage(tableId: string, text: string): Promise<ChatMessage> {
  return insertMessage(tableId, null, text)
}

/* gets the messages a new watcher should see */
export function getHistory(tableId: string): Promise<ChatMessage[]> {
  return recentMessages(tableId, CHAT_HISTORY_SIZE)
}