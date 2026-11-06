Chat feature (S15): design decisions

1. Rooms and numbers

- There is one chat per table. It uses the socket room the table already has (tableId), so there's no new namespace or room.
- Up to 6 people per table (MAX_PLAYERS).
- Only seated human players can send messages. Anyone watching the table can read them.
- There's no lobby chat for now.

Why: everyone on /table/[id] is already in the tableId room, so sending a message to the table is one line of code. Per-table chat stays small and easy to moderate.

2. Should chats be saved in the game state?

No. Chat is not part of GameState.

Why: GameState is reset every hand, and toPlayerView would have to carry chat for no reason. Chat should last longer than a single hand.

3. Should chats be saved in the database?

Yes, in the existing chat_message table.
- When someone joins, the last 50 messages are loaded.
- Messages are deleted when their table is deleted, because the schema already has ON DELETE CASCADE.

Why: the table and its index already exist. History survives a refresh or reconnect, admins can review reported messages, and old chat doesn't build up forever.

4. Should bots be able to chat?

No free chat from bots. The server can post system messages with user_id = null, for example "Alice joined" or "Bot 2 left". These show in grey italics.

Why: bots aren't built yet (S5), and fake bot chatter adds nothing. If bots get canned lines later, add a bot_name column to chat_message, the same way match_players names bots.

5. How does a player contact the admin?

- The "Contact admin" button in the chat panel opens a small form. It sends POST /support over REST, not the socket, and saves to the existing support_ticket table.
- A "Report" option on a message fills in the form with that message and the table.
- An admin page for viewing tickets comes later, and it must check user.role on the server.

Why: it doesn't need to be real time, the table and its access rules already exist, and it follows our route → controller → service → dao pattern.

---

Socket.io structure

Backend

- socket/chat.ts has registerChat(io, socket), called from the connection handler in io.ts.
- services/ChatService.ts:
  - send() checks the message is 1–500 characters and that the user is seated at the table, then saves it.
  - system() posts a system message.
- dao/ChatDAO.ts has insert() and recent(tableId, 50).
- Rate limit (NFR 6): each socket can send at most 5 messages per 10 seconds. The limit lives in a small helper so it's easy to test.

Events

┌─────────────┬──────────────┬───────────────────┬─────────────────────┐
│  Direction  │    Event     │      Payload      │        Reply        │
├─────────────┼──────────────┼───────────────────┼─────────────────────┤
│ client →    │ chat:history │ tableId           │ ack with            │
│ server      │              │                   │ ChatMessage[]       │
├─────────────┼──────────────┼───────────────────┼─────────────────────┤
│ client →    │ chat:send    │ { tableId,        │ ack with { ok } or  │
│ server      │              │ userId, body }    │ { error }           │
├─────────────┼──────────────┼───────────────────┼─────────────────────┤
│ server →    │ chat:message │ ChatMessage       │ —                   │
│ room        │              │                   │                     │
└─────────────┴──────────────┴───────────────────┴─────────────────────┘

Shared type in shared/Chat.d.ts:
ChatMessage { id, tableId, userId: string | null, name: string | null, body, createdAt }

Frontend

- service/ChatService.ts:
  - watchChat(tableId, onMessage) returns a disconnect function, the same way watchTable does.
  - sendChat() returns a Promise.
  - contactAdmin() posts to /support.
- Single socket: add a getSocket() singleton to SocketService.ts. Otherwise the table page opens two connections, one for the game and one for chat.
- UI:
  - Move component/unused/ChatPanel.tsx to component/ChatPanel.tsx and connect it to ChatService.
  - Add ContactAdminModal.tsx for the admin form.
  - Show the chat panel beside the table in GameTable.tsx.

Known risk

The server still trusts the userId the client sends, as it does everywhere else in the app. Checking that the sender is seated limits the damage. Chat will get proper protection when the backend starts checking sign-in tokens.