import Avatar from "@/component/Avatar"
import ContactAdminModal from "@/component/table/ContactAdminModal"
import Icon, { FLAG, SEND } from "@/component/common/Icon"
import { type ChatConnection, watchChat } from "@/service/ChatService"
import type { ChatMessage } from "@shared/Chat"
import { MAX_CHAT_LENGTH } from "@shared/Rules"
import { type FormEvent, useEffect, useRef, useState } from "react"

interface Props {
  tableId: string
  userId: string
  seated: boolean
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a3a5]"

/* Live table chat: history, new messages, quick chats and a capped input */
export default function ChatPanel({ tableId, userId, seated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [contacting, setContacting] = useState(false)
  const chat = useRef<ChatConnection | null>(null)
  const bottom = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    const connection = watchChat(tableId, setMessages, (message) =>
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
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-black bg-[#1f1a1b] text-ink shadow-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-panel-edge px-4 py-3">
        <h2 className="text-lg font-bold leading-tight">Chat</h2>
        <button
          type="button"
          onClick={() => setContacting(true)}
          aria-label="Contact Admin"
          title="Contact Admin"
          className={`grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink ${FOCUS}`}
        >
          <Icon d={FLAG} size={18} />
        </button>
      </header>
      {contacting && <ContactAdminModal tableId={tableId} onClose={() => setContacting(false)} />}

      <ul aria-label="Chat messages" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && <li className="pt-6 text-center text-sm text-ink-muted">No messages yet</li>}
        {messages.map((m, i) => {
          if (m.userId === null) {
            return (
              <li key={m.id} className="flex items-center gap-2 py-1 text-xs text-ink-muted">
                <span className="h-px flex-1 bg-panel-edge" />
                <span>{m.body}</span>
                <span className="text-[12px] text-ink-muted/60">{timeOf(m.createdAt)}</span>
                <span className="h-px flex-1 bg-panel-edge" />
              </li>
            )
          }
          const mine = m.userId === userId
          const followUp = messages[i - 1]?.userId === m.userId
          return (
            <li key={m.id} className={`flex gap-2.5 ${followUp ? "-mt-2" : ""}`}>
              {followUp ? <span className="w-7 shrink-0" /> : <Avatar name={m.name} url={m.avatarUrl} />}
              <div className="min-w-0 flex-1">
                {!followUp && (
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className={`font-semibold ${mine ? "text-[#e8a3a5]" : "text-ink"}`}>{mine ? "Me" : m.name}</span>
                    <span className="text-[12px] text-ink-muted/60">{timeOf(m.createdAt)}</span>
                  </p>
                )}
                <p className="break-words text-sm leading-snug text-[#e5dcdc]">{m.body}</p>
              </div>
            </li>
          )
        })}
        <li ref={bottom} aria-hidden />
      </ul>

      <div className="space-y-2 border-t border-panel-edge p-3">
        {error && (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}
        <form onSubmit={send}>
          <div className="relative">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!seated}
              maxLength={MAX_CHAT_LENGTH}
              aria-label="Chat message"
              placeholder={seated ? "Message" : "Take a seat"}
              className={`h-10 w-full rounded-md border border-panel-edge bg-panel-sunken pl-3 pr-24 text-sm text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-panel ${FOCUS}`}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {draft && <span className="text-xs text-ink-muted">{draft.length}/{MAX_CHAT_LENGTH}</span>}
              <button type="submit" aria-label="Send" disabled={!seated} className={`grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}>
                <Icon d={SEND} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </aside>
  )
}

/* Formats a timestamp as a short local time, e.g. 10:24 */
function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
