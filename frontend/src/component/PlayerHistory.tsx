"use client"

import BanModal from "@/component/BanModal"
import HandModal from "@/component/HandModal"
import Icon, { GAVEL, RESTORE } from "@/component/Icon"
import ModifyChipsModal from "@/component/ModifyChipsModal"
import { fetchPlayerHands, fetchPlayers, removePlayer, unbanPlayer } from "@/service/AdminService"
import type { HandRecord, PlayerSummary } from "@shared/PlayerHistory"
import { useEffect, useState } from "react"

const ICON = "grid size-8 place-items-center rounded-md text-[#9e9393] transition-colors hover:bg-white/10 hover:text-white"

export default function PlayerHistory() {
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hands, setHands] = useState<HandRecord[] | null>(null)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [openHand, setOpenHand] = useState<HandRecord | null>(null)
  const [removing, setRemoving] = useState(false)
  const [editingChips, setEditingChips] = useState(false)

  useEffect(() => {
    fetchPlayers()
      .then(setPlayers)
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    fetchPlayerHands(selectedId)
      .then(setHands)
      .catch((err: Error) => setError(err.message))
  }, [selectedId])

  function select(id: string) {
    setHands(null)
    setRemoving(false)
    setSelectedId(id)
  }

  async function remove(id: string) {
    try {
      await removePlayer(id)
      setPlayers(players.map((p) => (p.id === id ? { ...p, banned: true } : p)))
    } catch (err) {
      setError((err as Error).message)
    }
    setRemoving(false)
  }

  async function unban(id: string) {
    try {
      await unbanPlayer(id)
      setPlayers(players.map((p) => (p.id === id ? { ...p, banned: false } : p)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function saveChips(balance: number) {
    setPlayers(players.map((p) => (p.id === selectedId ? { ...p, balance } : p)))
    setEditingChips(false)
  }

  const selected = players.find((p) => p.id === selectedId)
  const shown = players.filter((p) => p.username.toLowerCase().includes(search.trim().toLowerCase()))
  const net = hands?.reduce((sum, hand) => sum + hand.netResult, 0) ?? 0

  function row(p: PlayerSummary) {
    return (
      <li key={p.id}>
        <button
          type="button"
          onClick={() => select(p.id)}
          className={`flex h-16 w-full items-center gap-3 rounded-md px-3 text-left transition-colors ${p.id === selectedId ? "bg-white/[.08]" : "hover:bg-white/[.04]"}`}
        >
          <span className="avatar-initial">{p.username[0]}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{p.username}</span>
            <small>{handCount(p.handsPlayed)}</small>
          </span>
          <span className="text-sm tabular-nums text-[#d8cfcf]">${p.balance.toLocaleString()}</span>
        </button>
      </li>
    )
  }

  return (
    <section className="panel overflow-hidden">
      {openHand && <HandModal matchId={openHand.matchId} tableName={openHand.tableName} onClose={() => setOpenHand(null)} />}
      {removing && selected && <BanModal player={selected} onCancel={() => setRemoving(false)} onBan={() => remove(selected.id)} />}
      {editingChips && selected && <ModifyChipsModal player={selected} onCancel={() => setEditingChips(false)} onSaved={saveChips} />}
      <div className="panel-head flush">
        <h2>Players</h2>
      </div>

      {error && <p className="m-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid md:h-[456px] md:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col border-b border-black/50 bg-black/20 md:border-b-0 md:border-r">
          <div className="p-3 pb-1">
            <input aria-label="Search players" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="simple-input" />
          </div>
          <ul className="max-h-[400px] flex-1 overflow-y-auto p-2 md:max-h-none">
            {shown.filter((p) => !p.banned).map(row)}
            {shown.some((p) => p.banned) && <li className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-[#9e9393]">Banned</li>}
            {shown.filter((p) => p.banned).map(row)}
            {shown.length === 0 && <li className="py-6 text-center text-sm text-[#9e9393]">No players found.</li>}
          </ul>
        </div>

        {selected ? (
          <div className="flex min-h-0 min-w-0 flex-col p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="avatar-initial size-11! text-lg">{selected.username[0]}</span>
                <h3 className="truncate text-xl font-bold">{selected.username}</h3>
                {selected.banned ? (
                  <button type="button" aria-label="Unban player" onClick={() => unban(selected.id)} className={`${ICON} -ml-2 hover:text-[#6fd099]`}>
                    <Icon d={RESTORE} />
                  </button>
                ) : (
                  <button type="button" aria-label="Ban player" onClick={() => setRemoving(true)} className={`${ICON} -ml-2 hover:text-red-300`}>
                    <Icon d="" solid={GAVEL} />
                  </button>
                )}
              </div>
              <div className="flex divide-x divide-white/10">
                <button type="button" aria-label="Modify chips" onClick={() => setEditingChips(true)} className="rounded-md py-1 pl-2 pr-4 text-right transition-colors hover:bg-white/[.06]">
                  <small>Balance</small>
                  <p className="flex items-center gap-2 text-lg font-bold tabular-nums">
                    <span className="chip" aria-hidden />${selected.balance.toLocaleString()}
                  </p>
                </button>
                <Stat label="Hands Played" value={selected.handsPlayed.toLocaleString()} />
                <Stat label="Net Result" value={money(net)} color={resultColor(net)} />
              </div>
            </div>

            <h4 className="mt-5 border-b border-white/10 pb-2 font-semibold">History</h4>
            {hands?.length === 0 && <p className="py-6 text-center text-sm text-[#9e9393]">No hands yet.</p>}
            <ul className="max-h-[280px] min-h-0 flex-1 overflow-y-auto md:max-h-none">
              {hands?.map((hand) => (
                <li key={hand.matchId} className="border-b border-white/5 last:border-0">
                  <button type="button" onClick={() => setOpenHand(hand)} className="flex w-full items-center justify-between gap-4 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-white/[.04]">
                    <span className="min-w-0">
                      <span className="block truncate">
                        <span className={resultColor(hand.netResult)}>{resultText(hand.netResult)}</span>
                        {` at ${hand.tableName}`}
                      </span>
                      <small>
                        Hand #{hand.handNumber} · Pot ${hand.pot.toLocaleString()}
                        {hand.winner && ` · Won by ${hand.winner}`}
                      </small>
                    </span>
                    <small className="whitespace-nowrap">{formatTime(hand.endedAt)}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="grid place-items-center p-10 text-sm text-[#9e9393]">Select a player to see their history.</p>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-4 text-right first:pl-0 last:pr-0">
      <small>{label}</small>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

function handCount(count: number) {
  return count === 1 ? "1 hand" : `${count} hands`
}

function money(amount: number) {
  return `${amount < 0 ? "-" : ""}$${Math.abs(amount).toLocaleString()}`
}

function resultColor(net: number) {
  if (net > 0) return "text-[#6fd099]"
  if (net < 0) return "text-red-300"
  return ""
}

function resultText(net: number) {
  if (net > 0) return `Won $${net.toLocaleString()}`
  if (net < 0) return `Lost $${(-net).toLocaleString()}`
  return "Broke even"
}

function formatTime(date: string) {
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}
