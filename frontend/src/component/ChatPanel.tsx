import { type ChatConnection, watchChat } from "@/service/ChatService"
import type { ChatMessage } from "@shared/Chat"
import { MAX_CHAT_LENGTH, QUICK_CHATS } from "@shared/Rules"
import { type FormEvent, useEffect, useRef, useState } from "react"

interface Props {
  tableId: string
  tableName: string
  handNumber: number | null
  playerCount: number
  userId: string
  seated: boolean
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a3a5]"

/* Live table chat: history, new messages, quick chats and a capped input */
export default function ChatPanel({ tableId, tableName, handNumber, playerCount, userId, seated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const chat = useRef<ChatConnection | null>(null)
  const bottom = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const connection = watchChat(tableId, userId, setMessages, (message) =>
      setMessages((previous) => [...previous, message]),
    )
    chat.current = connection
    return connection.stop
  }, [tableId, userId])

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "end" })
  }, [messages])

  /* Sends one message; clears the box on success or shows why it was refused */
  async function post(body: string) {
    if (!chat.current) return
    const reply = await chat.current.send(body)
    if (reply.ok) {
      setDraft("")
      setError(null)
    } else {
      setError(reply.error)
    }
  }

  /* Form submit: ignores blank drafts */
  async function send(event: FormEvent) {
    event.preventDefault()
    if (draft.trim()) await post(draft.trim())
  }

  return (
    <aside
      aria-label="Table chat"
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-black bg-panel text-ink shadow-2xl"
    >
      <header className="border-b border-panel-edge px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold leading-tight">Table chat</h2>
          {/* shown for the mockup; contact admin comes in a later story */}
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded border border-panel-edge bg-panel-raised px-2.5 py-1 text-sm font-semibold text-ink-muted disabled:cursor-not-allowed"
          >
            Contact admin
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3 text-sm text-ink-muted">
          <p className="min-w-0 truncate">
            <span className="font-bold uppercase tracking-wider text-ink">{tableName}</span>
            {!!handNumber && (
              <>
                <span aria-hidden> · </span>
                <span>Hand #{handNumber}</span>
              </>
            )}
          </p>
          <p className="flex shrink-0 items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green-400" />
            {/* counts seated players, not who has the page open; TODO real presence if needed */}
            {playerCount} {playerCount === 1 ? "player" : "players"} online
          </p>
        </div>
      </header>

      <ul aria-label="Chat messages" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && <li className="pt-6 text-center text-sm text-ink-muted">No messages yet</li>}
        {messages.map((m) => {
          if (m.userId === null) {
            return (
              <li key={m.id} className="flex items-center gap-2 py-1 text-sm text-ink-muted">
                <span className="h-px flex-1 bg-panel-edge" />
                <span>{m.body}</span>
                <span>{timeOf(m.createdAt)}</span>
                <span className="h-px flex-1 bg-panel-edge" />
              </li>
            )
          }
          // your own messages sit on the right in red, everyone else's on the left
          const mine = m.userId === userId
          return (
            <li key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={m.name} url={m.avatarUrl} />
              <div className={`flex min-w-0 max-w-[80%] flex-col ${mine ? "items-end" : "items-start"}`}>
                <p className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink">{mine ? "Me" : m.name}</span>
                  <span className="ml-2">{timeOf(m.createdAt)}</span>
                </p>
                <p className={`mt-1 break-words rounded-lg px-3 py-2 text-base ${mine ? "rounded-tr-sm bg-panel-mine" : "rounded-tl-sm bg-panel-raised"}`}>
                  {m.body}
                </p>
              </div>
            </li>
          )
        })}
        <li ref={bottom} aria-hidden />
      </ul>

      <div className="space-y-2 border-t border-panel-edge p-3">
        {seated && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHATS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => post(text)}
                className={`rounded-full border border-panel-edge bg-panel-raised px-3 py-1 text-sm text-ink hover:bg-panel-edge ${FOCUS}`}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <form onSubmit={send} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!seated}
              maxLength={MAX_CHAT_LENGTH}
              aria-label="Chat message"
              placeholder={seated ? "Message the table" : "Take a seat to chat"}
              className={`h-11 w-full rounded-md border border-panel-edge bg-panel-sunken pl-3 pr-16 text-base text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-panel ${FOCUS}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
              {draft.length}/{MAX_CHAT_LENGTH}
            </span>
          </div>
          <button type="submit" disabled={!seated} className={`secondary-action disabled:cursor-not-allowed disabled:brightness-75 ${FOCUS}`}>
            Send
          </button>
        </form>
      </div>
    </aside>
  )
}

/* A sender's profile picture, or their initial if they have none or it fails to load */
function Avatar({ name, url }: { name: string | null; url: string | null }) {
  const [broken, setBroken] = useState(false)
  const shape = "size-9 shrink-0 rounded-full border border-panel-edge"
  if (url && !broken) {
    // plain <img>: avatars can come from any host, which next/image would need configuring for
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" onError={() => setBroken(true)} className={`${shape} object-cover`} />
  }
  return (
    <span aria-hidden className={`${shape} flex items-center justify-center bg-panel-raised text-sm font-semibold`}>
      {(name ?? "?")[0].toUpperCase()}
    </span>
  )
}

/* Formats a timestamp as a short local time, e.g. 10:24 */
function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}
