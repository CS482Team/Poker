"use client"

import ActionBar from "@/component/ActionBar"
import CardFan from "@/component/CardFan"
import ChatPanel from "@/component/ChatPanel"
import Dots from "@/component/Dots"
import EmptySeat from "@/component/EmptySeat"
import Icon, { LEAVE } from "@/component/Icon"
import RoomSettings from "@/component/RoomSettings" 
import { clearCurrentTableId } from "@/service/CurrentTableService"
import { act, draw } from "@/service/GameService"
import { watchTable } from "@/service/SocketService"
import { fetchTable, leaveTable } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"
import PlayerHand from "@/component/PlayerHand"
import type { ActionType } from "@shared/Actions"
import type { PlayerView, PublicPlayer } from "@shared/PlayerView"
import type { Table } from "@shared/Table"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/* [left %, top %] of each seat around the table, for a table of 1 to 6 seats */
const SEAT_SPOTS = [
  [],
  [[50, 12]],
  [[17, 24], [83, 24]],
  [[17, 24], [50, 12], [83, 24]],
  [[17, 24], [38, 12], [62, 12], [83, 24]],
  [[9, 64], [17, 24], [50, 12], [83, 24], [91, 64]],
  [[9, 64], [17, 24], [38, 12], [62, 12], [83, 24], [91, 64]],
]

/* where seat `i` of a `count`-seat table sits */
function seatPosition(i: number, count: number) {
  const [left, top] = SEAT_SPOTS[count]![i]!
  return { left: `${left}%`, top: `${top}%` }
}

export default function GameTable({ id }: { id: string }) {
  const router = useRouter()
  const [table, setTable] = useState<Table | null>(null)
  const [view, setView] = useState<PlayerView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const canDraw = view?.phase === "draw" && view.toActSeat === view.you.seat
  const tableSeats = table?.seats ?? []
  const openSeats = Array.from({ length: table?.maxPlayers ?? 0 }, (_, n) => n).filter(n => !tableSeats.some(s => s.seatNumber === n))
  const botSeats = (view?.players ?? [])
  .filter(p => !tableSeats.some(s => s.userId === p.id))
  .map((p, i) => ({ userId: p.id, username: p.name, seatNumber: openSeats[i]!, stack: p.stack }))
  const seats = [...tableSeats, ...botSeats]


  useEffect(() => {
    fetchTable(id)
      .then((loaded) => {
        setTable(loaded)
        setError(null)
      })
      .catch((err: Error) => {
        clearCurrentTableId()
        setError(err.message)
      })
    return watchTable(id, getCurrentUserId(), setTable, setView)
  }, [id])

  useEffect(() => {
    if (!canDraw) setSelected([])
  }, [canDraw])

  async function leave() {
    try {
      await leaveTable(id, getCurrentUserId())
      clearCurrentTableId()
      router.push("/dashboard")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleAction(type: ActionType, amount?: number) {
    if (!view) return
    setBusy(true)
    setActionError(null)
    try {
      await act(view.gameId, getCurrentUserId(), type, amount)
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function toggleCard(i: number) {
    if (selected.includes(i)) setSelected(selected.filter((x) => x !== i))
    else setSelected([...selected, i])
  }

  async function handleDraw() {
    if (!view) return
    setBusy(true)
    setActionError(null)
    try {
      await draw(view.gameId, getCurrentUserId(), selected)
      setSelected([])
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error) return <p className="p-8 text-center text-red-600">{error}</p>
  if (!table) return <p className="p-8 text-center">Loading table…</p>

  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-8 sm:px-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-x-12 md:gap-y-12 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-x-14">
      <div className="flex items-center gap-3">
        <button type="button" onClick={leave} className="secondary-action small gap-1.5">
          <Icon d={LEAVE} size={14} />
          Leave
        </button>
        <h1 className="truncate text-3xl font-bold">{table.name}</h1>
        {table.hostId === getCurrentUserId() && (
        <button type="button" onClick={() => setSettingsOpen(true)} className="secondary-action small">
          Settings
        </button>
        )}
      </div>
      <div className="mx-auto flex w-full max-w-[780px] flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#d8cfcf] md:justify-end">
        <span>Min Bet <b className="ml-1 text-base text-white">${table.minimumBet}</b></span>
        <span>Ante <b className="ml-1 text-base text-white">${table.ante}</b></span>
        <span>Buy-in <b className="ml-1 text-base text-white">${table.buyIn}</b></span>
        <span>Max Players <b className="ml-1 text-base text-white">{table.maxPlayers}</b></span>
      </div>
      <div className="order-last h-[28rem] md:order-none md:h-[520px]">
        {table.chatEnabled ? (
          <ChatPanel
            tableId={table.id}
            userId={getCurrentUserId()}
            seated={table.seats.some((seat) => seat.userId === getCurrentUserId())}
          />
        ) : (
          <p className="panel p-6 text-center text-sm text-[#9e9393]">Chat is turned off at this table.</p>
        )}
      </div>
      <div className="relative isolate mx-auto w-full min-w-0 max-w-[780px] px-2 sm:px-0">
        <div className="poker-table relative h-[436px] rounded-[44%/50%]">
          <div className="table-line absolute inset-[26px] rounded-[44%/50%]" />
          {/* once the hand is paid out, the pot glides to the winner (each share to its winner in a split pot);
              the words stay for screen readers */}
          {view && Object.keys(view.winnings ?? {}).length > 0 ? (
            <>
              <p className="sr-only" role="status">{winnerText(view)}</p>
              {Object.entries(view.winnings).map(([winnerId, chips]) => {
                const seat = seats.find((s) => s.userId === winnerId)
                if (!seat) return null
                const to = seatPosition(seat.seatNumber, table.maxPlayers)
                return (
                  <div
                    key={winnerId}
                    data-pot-slide
                    aria-hidden
                    className="pot pot-slide"
                    style={{ "--to-left": to.left, "--to-top": to.top } as React.CSSProperties}
                  >
                    <span className="chip" />
                    <strong>${chips.toLocaleString()}</strong>
                  </div>
                )
              })}
            </>
          ) : (
            view && (
              <div className="pot">
                <span className="chip" aria-hidden />
                <small>Pot</small>
                <strong>${view.pot.toLocaleString()}</strong>
              </div>
            )
          )}
          {view && (
            <p className={`absolute bottom-[72px] left-1/2 -translate-x-1/2 whitespace-nowrap text-base ${actionError ? "text-red-300" : "text-white/75"}`}>
              <span>{actionError ?? statusText(view)}</span>
              {!actionError && view.toActSeat !== view.you.seat && <Dots />}
            </p>
          )}
          {/* every seat has a fixed spot by seat number, so players don't move as others join or leave */}
          {Array.from({ length: table.maxPlayers }, (_, seatNumber) => {
            const seat = seats.find((s) => s.seatNumber === seatNumber)
            const position = seatPosition(seatNumber, table.maxPlayers)
            if (!seat) {
              return (
                <div key={`open-${seatNumber}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={position}>
                  <EmptySeat />
                </div>
              )
            }
            const mine = seat.userId === getCurrentUserId()
            const name = mine ? "Me" : seat.username
            // the game's view of this player; `live.seat` is their place in the game's turn order, not the table seat
            const live = view?.players.find((p) => p.id === seat.userId)
            const won = view?.winners.includes(seat.userId)
            const bot = !tableSeats.some((s) => s.userId === seat.userId)
            const folded = live?.status === "folded"
            const toAct = live !== undefined && live.seat === view?.toActSeat
            const dealer = live !== undefined && live.seat === view?.dealerSeat
            const fanned = live && !mine && !folded && live.cardCount > 0 // your own hand is shown below the table
            return (
              <div
                key={seat.userId}
                data-seat
                className={`absolute -translate-x-1/2 -translate-y-1/2 text-center transition-opacity ${folded ? "opacity-50" : ""}`}
                style={position}
              >
                {/* the fan sits above the portrait, which covers just the bottom of the cards (like the mockup) */}
                <div className="relative">
                  {fanned && (
                    <div
                      role="img"
                      aria-label={`${name} has ${live.cardCount} cards`}
                      className="absolute bottom-[calc(100%-18px)] left-1/2 -translate-x-1/2"
                    >
                      <CardFan count={live.cardCount} />
                    </div>
                  )}
                  {won && (
                    <svg viewBox="0 0 24 16" fill="#e8b84a" aria-label="Winner" className="absolute -top-6 left-1/2 z-10 h-5 w-7 -translate-x-1/2">
                      <path d="M0 16 L2 4 L7 9 L12 0 L17 9 L22 4 L24 16 Z" />
                    </svg>
                  )}
                  <div
                    className={`seat-portrait ${won ? "winner" : ""} ${toAct ? "animate-turn-glow" : ""}`}
                    style={bot && !won ? { borderColor: "#72bbea" } : undefined}
                  >
                    {name[0]}
                    {dealer && (
                      <span className="dealer-chip" aria-label="Dealer">
                        D
                      </span>
                    )}
                  </div>
                </div>
                <div className="seat-label">
                  <span>{name}</span>
                  <small>${(live?.stack ?? seat.stack).toLocaleString()}</small>
                </div>
                {live && actionText(live) && <small>{actionText(live)}</small>}
              </div>
            )
          })}
        </div>
        {view && (
          <div className="relative z-10 -mt-12">
            <PlayerHand
              cards={view.you.hand}
              selected={selected}
              canSelect={canDraw && !busy}
              onToggle={toggleCard}
            />
          </div>
        )}
        {canDraw && view && (
          <div className="mt-6 flex min-h-[3.25rem] items-center justify-center gap-4">
            <p aria-live="polite" className="text-sm text-[#d8cfcf]">
              {discardText(selected.length, view.you.hand.length)}
            </p>
            <button type="button" onClick={handleDraw} disabled={busy} className="secondary-action">
              Draw
            </button>
          </div>
        )}
        {view && !canDraw && (
          <div className="mt-6">
            <ActionBar
              key={`${view.toActSeat}-${view.round?.currentBet}`}
              legalActions={view.you.legalActions}
              busy={busy}
              onAction={handleAction}
            />
          </div>
        )}
      </div>
      {settingsOpen && <RoomSettings table={table} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

/* who won the hand and how much: "You won 120 chips", "Maya won 120 chips"; a split pot lists each share */
function winnerText(view: PlayerView): string {
  const myId = view.players[view.you.seat]?.id
  return Object.entries(view.winnings)
    .map(([id, chips]) => {
      const who = id === myId ? "You" : (view.players.find((p) => p.id === id)?.name ?? "A player")
      return `${who} won ${chips.toLocaleString()} ${chips === 1 ? "chip" : "chips"}`
    })
    .join(" · ")
}

/* what the player did last this round, e.g. "Check" or "Raise $20" */
function actionText(p: PublicPlayer): string | null {
  if (p.status === "folded") return "Folded"
  if (p.lastAction === "check") return "Check"
  if (p.lastAction === "call") return `Call $${p.betThisRound}`
  if (p.lastAction === "bet") return `Bet $${p.betThisRound}`
  if (p.lastAction === "raise") return `Raise $${p.betThisRound}`
  return null
}

/* tells the player what pressing Draw will do, e.g. "Discarding 2 cards" */
function discardText(discarding: number, handSize: number): string {
  if (discarding === 0) return `Keeping all ${handSize} cards`
  return `Discarding ${discarding} ${discarding === 1 ? "card" : "cards"}`
}

function statusText(view: PlayerView): string {
  if (view.phase === "draw") {
    return view.toActSeat === view.you.seat ? "Pick cards to replace" : "Waiting for others to draw"
  }
  const toAct = view.toActSeat === null ? undefined : view.players[view.toActSeat]
  if (!toAct) return "Round over, waiting for next round"
  return toAct.seat === view.you.seat ? "Your turn" : `${toAct.name} to act`
}
