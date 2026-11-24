"use client"

/* body of /friends: add by username, then Friends / Requests / Recent players tabs */
import Avatar from "@/component/cosmetic/Avatar"
import Icon, { CHECK, CROSS, JOIN, RETURN, USER_PLUS } from "@/component/common/Icon"
import { getCurrentTableId, setCurrentTableId } from "@/service/CurrentTableService"
import { acceptFriendRequest, fetchFriends, fetchRecentPlayers, removeFriend, sendFriendRequest } from "@/service/FriendService"
import { joinTable } from "@/service/TableService"
import { isGuest } from "@/service/UserService"
import type { Friend, FriendPlayer, FriendsList, RecentPlayer } from "@shared/Friends"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, type ReactNode, useCallback, useEffect, useState, useSyncExternalStore } from "react"

type Tab = "friends" | "requests" | "recent"

const loadAll = () => Promise.all([fetchFriends(), fetchRecentPlayers()])

// the session never changes while the page is open, so there's nothing to subscribe to
const noSubscribe = () => () => {}

export default function FriendsPage() {
  const router = useRouter()
  // null on the server render (no browser storage there)
  const guest = useSyncExternalStore(noSubscribe, isGuest, () => null)
  const [list, setList] = useState<FriendsList | null>(null)
  const [recent, setRecent] = useState<RecentPlayer[] | null>(null)
  const [tab, setTab] = useState<Tab>("friends")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // the player whose button is working
  const [confirming, setConfirming] = useState<string | null>(null) // the friend whose Remove is asking "are you sure?"

  const show = useCallback(([friends, players]: [FriendsList, RecentPlayer[]]) => {
    setList(friends)
    setRecent(players)
  }, [])
  const reload = async () => show(await loadAll())

  useEffect(() => {
    if (guest !== false) return
    loadAll()
      .then(show)
      .catch((e: Error) => setError(e.message))
  }, [guest, show])

  /* runs one button's action, then reloads so the page matches the server; true if it worked */
  async function act(userId: string, action: () => Promise<string | void>): Promise<boolean> {
    setBusy(userId)
    setError(null)
    setNotice(null)
    try {
      const message = await action()
      if (message) setNotice(message)
      await reload()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy(null)
      setConfirming(null)
    }
  }

  async function add(username: string) {
    const { status, player } = await sendFriendRequest(username)
    return status === "accepted" ? `You and ${player.username} are now friends.` : `Friend request sent to ${player.username}.`
  }

  async function join(friend: Friend) {
    const table = friend.table!
    setError(null)
    try {
      if (getCurrentTableId() !== table.id) {
        await joinTable(table.id)
        setCurrentTableId(table.id)
      }
      router.push(`/table/${table.id}`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (guest === null) return <div className="page-shell" />

  if (guest) {
    return (
      <div className="page-shell">
        <h1 className="page-title mb-6">Friends</h1>
        <section className="panel p-8 text-center text-lg">
          <p>Sign up to keep a friends list and play with them again.</p>
          <Link href="/signup" className="primary-action buy-action mt-5">Sign up</Link>
        </section>
      </div>
    )
  }

  const incoming = list?.incoming.length ?? 0
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "friends", label: "Friends", count: list?.friends.length },
    { id: "requests", label: "Requests", count: incoming || undefined },
    { id: "recent", label: "Recent players" },
  ]

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Friends</h1>
      </div>

      <AddFriendForm onAdd={(username) => act("add", () => add(username))} busy={busy === "add"} />

      {error && <p role="alert" className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-md bg-[#6fd099]/10 px-3 py-2 text-sm text-[#9be3b8]">{notice}</p>}

      <div className="panel shop-tabbar">
        <div role="tablist" aria-label="Friends" className="shop-tabs">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-controls="friends-panel" aria-selected={tab === t.id} className={tab === t.id ? "shop-tab active" : "shop-tab"} onClick={() => setTab(t.id)}>
              {t.label}
              {t.count !== undefined && <span className={`ml-1.5 rounded-full px-1.5 text-xs ${t.id === "requests" ? "bg-red-500 text-white" : "bg-white/10"}`}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <section role="tabpanel" id="friends-panel" aria-labelledby={`tab-${tab}`} className="panel overflow-hidden">
        {list === null || recent === null ? (
          !error && <Empty>Loading…</Empty>
        ) : tab === "friends" ? (
          list.friends.length === 0 ? (
            <Empty>No friends yet. Add someone by username, or from Recent players.</Empty>
          ) : (
            list.friends.map((f) => (
              <PlayerRow key={f.userId} player={f} detail={f.table ? `At ${f.table.name}` : "Not at a table"} online={f.table !== null}>
                {confirming === f.userId ? (
                  <>
                    <span className="text-sm text-[#b5a9a9]">Remove {f.username}?</span>
                    <button type="button" disabled={busy === f.userId} onClick={() => act(f.userId, async () => { await removeFriend(f.userId); return `Removed ${f.username} from your friends.` })} className="secondary-action small text-red-300">Remove</button>
                    <button type="button" onClick={() => setConfirming(null)} className="secondary-action small">Cancel</button>
                  </>
                ) : (
                  <>
                    {f.table && (
                      <button type="button" onClick={() => join(f)} className="secondary-action small gap-1.5">
                        <Icon d={getCurrentTableId() === f.table.id ? RETURN : JOIN} size={14} />
                        {getCurrentTableId() === f.table.id ? "Return" : "Join"}
                      </button>
                    )}
                    <button type="button" aria-label={`Remove ${f.username}`} title="Remove friend" onClick={() => setConfirming(f.userId)} className="secondary-action small icon-action">
                      <Icon d={CROSS} size={14} />
                    </button>
                  </>
                )}
              </PlayerRow>
            ))
          )
        ) : tab === "requests" ? (
          incoming + list.outgoing.length === 0 ? (
            <Empty>No friend requests right now.</Empty>
          ) : (
            <>
              {list.incoming.map((r) => (
                <PlayerRow key={r.userId} player={r} detail={`Wants to be friends · ${ago(r.sentAt)}`}>
                  <button type="button" disabled={busy === r.userId} onClick={() => act(r.userId, async () => { await acceptFriendRequest(r.userId); return `You and ${r.username} are now friends.` })} className="primary-action small gap-1.5">
                    <Icon d={CHECK} size={14} />
                    Accept
                  </button>
                  <button type="button" disabled={busy === r.userId} onClick={() => act(r.userId, () => removeFriend(r.userId))} className="secondary-action small">Decline</button>
                </PlayerRow>
              ))}
              {list.outgoing.map((r) => (
                <PlayerRow key={r.userId} player={r} detail={`Request sent · ${ago(r.sentAt)}`}>
                  <button type="button" disabled={busy === r.userId} onClick={() => act(r.userId, () => removeFriend(r.userId))} className="secondary-action small">Cancel request</button>
                </PlayerRow>
              ))}
            </>
          )
        ) : recent.length === 0 ? (
          <Empty>Players from your recent games show up here.</Empty>
        ) : (
          recent.map((p) => (
            <PlayerRow key={p.userId} player={p} detail={`Played ${ago(p.lastPlayedAt)}`}>
              <button type="button" disabled={busy === p.userId} onClick={() => act(p.userId, () => add(p.username))} className="secondary-action small gap-1.5">
                <Icon d={USER_PLUS} size={14} />
                Add
              </button>
            </PlayerRow>
          ))
        )}
      </section>
    </div>
  )
}

/* the "Add friend" box: a username and a button */
function AddFriendForm({ onAdd, busy }: { onAdd: (username: string) => Promise<boolean>; busy: boolean }) {
  const [username, setUsername] = useState("")

  async function submit(e: FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name) return
    if (await onAdd(name)) setUsername("") // keep it on a mistake, so it can be fixed
  }

  return (
    <form onSubmit={submit} className="panel mb-4 flex flex-wrap items-center gap-3 p-4">
      <label htmlFor="friend-username" className="font-semibold">Add a friend</label>
      <input
        id="friend-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Their username"
        maxLength={20}
        autoComplete="off"
        className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-3 py-2"
      />
      <button type="submit" disabled={busy || username.trim().length < 3} className="primary-action small gap-1.5 disabled:opacity-40">
        <Icon d={USER_PLUS} size={16} />
        Send request
      </button>
    </form>
  )
}

/* one player: picture, name, a line about them, and their buttons */
function PlayerRow({ player, detail, online, children }: { player: FriendPlayer; detail: string; online?: boolean; children: ReactNode }) {
  return (
    <div aria-label={player.username} role="group" className="list-row flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-3 last:border-0">
      <span className="avatar-initial relative">
        <Avatar username={player.username} url={player.avatarUrl} />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block truncate">{player.username}</strong>
        <small className="flex items-center gap-1.5 text-[#b5a9a9]">
          {online !== undefined && <span aria-hidden className={`size-2 rounded-full ${online ? "bg-[#6fd099]" : "bg-[#6b6262]"}`} />}
          {detail}
        </small>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-6 py-12 text-center text-sm text-[#a99898]">{children}</p>
}

/* "just now", "5 min ago", "3 h ago", "2 days ago" */
export function ago(iso: string, now: Date = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}
