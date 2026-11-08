# Table chat (S15 / issue #18): design

Live chat for each poker table. This doc records the decisions and how the pieces fit together. It describes the code as built; see the source files named below for details.

## Decisions

### 1. Rooms and who can chat
- **One chat per table.** Each table's chat has its own socket room, `chat:<tableId>`.
- Up to 6 people per table (`MAX_PLAYERS`).
- **Only seated players can send.** Anyone watching the table can read.
- **No lobby chat** for now.

**Why a separate room:** the chat opens its own socket (see [Frontend](#frontend)), so it shouldn't join the table's `tableId` room and receive game updates it doesn't use.

### 2. Is chat part of the game state?
**No.** Chat is not in `GameState`.

**Why:** `GameState` covers a single hand, and `toPlayerView` would have to carry chat for no reason. Chat should last longer than one hand.

### 3. Is chat saved in the database?
**Yes**, in the existing `chat_message` table.
- When someone opens the table, the last **50** messages load (`CHAT_HISTORY_SIZE`).
- Messages are deleted with their table (`ON DELETE CASCADE`), so old chat doesn't pile up.

**Why:** the table and its `(table_id, id DESC)` index already existed. History survives a refresh or reconnect.

### 4. Can bots chat?
**No.** Bots don't send chat. The server posts **system messages** with `user_id = null`:
- "Maya joined the table" when someone takes a seat
- "Maya left the table" when a seated player leaves and others remain

There's no message when the last player leaves, because the table and its chat are deleted then.

**Why:** bots aren't built yet (S5). If bots get canned lines later, add a `bot_name` column to `chat_message`, as `match_players` does.

### 5. Quick chats
Preset buttons ("Nice hand", "Good luck") from `QUICK_CHATS` in `shared/Rules.ts`. They send through `chat:send` like typed messages, so they're saved, rate limited and seat-checked the same way. To add one, add a string to the list.

### 6. Contact admin: later story
The "Contact admin" button is shown in the chat header but is **disabled** for now. Support tickets (`support_ticket` table, `POST /support`) and an admin page that checks `user.role` on the server will come in a later story.

---

## Socket events

| Direction | Event | Payload | Reply (ack) |
|---|---|---|---|
| client → server | `chat:join` | `tableId` | `ChatMessage[]`: the last 50 messages. Also joins the socket to `chat:<tableId>`. |
| client → server | `chat:send` | `{ tableId, userId, body }` | `{ ok: true }` or `{ ok: false, error }` |
| server → room `chat:<tableId>` | `chat:message` | `ChatMessage` | — |

`chat:send` is refused with a readable error when:
- the message is empty or over **160** characters (`MAX_CHAT_LENGTH`; the database allows 500)
- the sender isn't seated at that table
- the sender has sent more than **5 messages in 10 seconds** (NFR 6)

Shared types are in `shared/Chat.d.ts`:
```ts
ChatMessage { id: number, tableId, userId: string | null, name: string | null, avatarUrl: string | null, body, createdAt }
ChatSend    { tableId, userId, body }
ChatReply   = { ok: true } | { ok: false, error }
```
`userId: null` means a system message. `avatarUrl` comes from `user.avatar_url`.

---

## Backend

| File | Role |
|---|---|
| `socket/chat.ts` | `registerChat(socket, broadcast)`: handles `chat:join` and `chat:send`, and holds the rate limiter |
| `socket/io.ts` | Calls `registerChat` on each connection; `broadcastChat(message)` sends to the chat room |
| `socket/RateLimiter.ts` | Sliding-window limiter, 5 hits per 10 s per socket |
| `services/ChatService.ts` | `sendMessage` (trim, length check, seat check, save), `sendSystemMessage`, `getHistory` |
| `dao/ChatDAO.ts` | `insertMessage`, `recentMessages(tableId, 50)`; joins `user(username, avatar_url)` |
| `dao/TablePlayersDAO.ts` | `isSeated(tableId, userId)` |
| `dao/UserDAO.ts` | `getUsername(userId)` for system messages |
| `controller/TableController.ts` | `announce()` posts the join and leave messages; a failure is logged and never blocks joining or leaving |

`broadcastChat` is passed into `registerChat` rather than imported, so `chat.ts` doesn't import `io.ts` (no circular import).

## Frontend

| File | Role |
|---|---|
| `service/ChatService.ts` | `watchChat(tableId, userId, onHistory, onMessage)` opens a socket, emits `chat:join`, listens for `chat:message`, and returns `{ send, stop }` |
| `component/ChatPanel.tsx` | Header (title + disabled Contact admin), message list with avatars and system lines, quick chats, input with a `n/160` counter |
| `component/GameTable.tsx` | Puts the chat in a column beside the table |

**Layout:**
- From **768px** wide, including a half-screen window on a laptop, the chat sits left of the table at a fixed **520px** tall (table title + table). The fixed height keeps zoom from stretching it.
  - Width: 260px from 768px, 320px from 1024px, 360px from 1280px. It's narrower on mid-size screens to leave the table room.
- Phones (under 768px): it stacks under the table at full width, 448px tall.

**Look:** solid panel colours (`panel`, `panel-raised`, `panel-sunken`, `panel-edge`, `panel-mine`, `ink`, `ink-muted` in `globals.css`). All text passes WCAG AA contrast on them. Your own messages sit on the right in red; everyone else's sit on the left. Avatars fall back to the sender's initial when there's no picture or it fails to load.

---

## Known limits and TODOs
- **Trusted user id:** the server still trusts the `userId` the client sends, as the rest of the app does. The seat check limits the damage; chat gets real protection when the backend verifies sign-in tokens.
- **Two sockets on the table page:** the chat opens its own socket next to `watchTable`'s. TODO in `frontend/src/service/ChatService.ts`: share one.
- **Rate limits live in memory:** they reset on restart and only work with one backend server.
- **History is capped at 50:** add "load older" paging if long chats need it.
- **Contact admin** and support tickets: later story.
