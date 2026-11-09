"use client"

import ActionBar from "@/component/ActionBar"
import CardFan from "@/component/CardFan"
import ChatPanel from "@/component/ChatPanel"
import EmptySeat from "@/component/EmptySeat"
import { clearCurrentTableId } from "@/service/CurrentTableService"
import { act, draw } from "@/service/GameService"
import { watchTable } from "@/service/SocketService"
import { fetchTable, leaveTable } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"
import PlayerHand from "@/component/PlayerHand"
import type { ActionType } from "@shared/Actions"
import type { PlayerView } from "@shared/PlayerView"
import type { Table } from "@shared/Table"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/* where seat `i` of `count` sits: spread along the top arc of the table, left to right */
function seatPosition(i: number, count: number) {
  const angle = count === 1 ? Math.PI / 2 : Math.PI - (i * Math.PI) / (count - 1)
  return { left: `${50 + 43 * Math.cos(angle)}%`, top: `${55 - 41 * Math.sin(angle)}%` }
}

export default function GameTable({ id }: { id: string }) {
  const router = useRouter()
  const [table, setTable] = useState<Table | null>(null)
  const [view, setView] = useState<PlayerView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const canDraw = view?.phase === "draw" && view.toActSeat === view.you.seat

  useEffect(() => {
    fetchTable(id)
      .then((loaded) => {
        setTable(loaded)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
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
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:gap-12 xl:gap-14">
      {/* sits left of the table from 768px wide (incl. half-screen windows) at a fixed height (table title + table = 520px)
          so zoom doesn't stretch it; only stacks under the table on phones */}
      <div className="order-2 h-[28rem] w-full shrink-0 md:sticky md:top-6 md:order-1 md:h-[520px] md:w-[260px] lg:w-[320px] xl:w-[360px]">
        <ChatPanel
          tableId={table.id}
          userId={getCurrentUserId()}
          seated={table.seats.some((seat) => seat.userId === getCurrentUserId())}
        />
      </div>
      <div className="relative isolate order-1 mx-auto w-full min-w-0 max-w-[780px] px-2 sm:px-0 md:order-2">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <h1 className="text-3xl font-bold">{table.name}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#d8cfcf]">
            <span>Min bet <b className="ml-1 text-base text-white">${table.minimumBet}</b></span>
            <span>Ante <b className="ml-1 text-base text-white">${table.ante}</b></span>
            <span>Buy-in <b className="ml-1 text-base text-white">${table.buyIn}</b></span>
            <span>Max players <b className="ml-1 text-base text-white">{table.maxPlayers}</b></span>
          </div>
        </div>
        <div className="poker-table relative h-[436px] rounded-[44%/50%]">
          <div className="table-line absolute inset-[26px] rounded-[44%/50%]" />
          {/* once the hand is paid out, the pot glides to the winner (each share to its winner in a split pot);
              the words stay for screen readers */}
          {view && Object.keys(view.winnings ?? {}).length > 0 ? (
            <>
              <p className="sr-only" role="status">{winnerText(view)}</p>
              {Object.entries(view.winnings).map(([winnerId, chips]) => {
                const seat = table.seats.find((s) => s.userId === winnerId)
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
          {/* every seat has a fixed spot by seat number, so players don't move as others join or leave */}
          {Array.from({ length: table.maxPlayers }, (_, seatNumber) => {
            const seat = table.seats.find((s) => s.seatNumber === seatNumber)
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
                  <div className={`seat-portrait ${won ? "winner" : ""} ${toAct ? "animate-turn-glow" : ""}`}>
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
                {folded ? <small>Folded</small> : live && live.betThisRound > 0 && <small>Bet ${live.betThisRound}</small>}
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
          <div className="mt-6 flex items-center justify-center gap-4">
            <p aria-live="polite" className="text-sm text-[#d8cfcf]">
              {discardText(selected.length, view.you.hand.length)}
            </p>
            <button type="button" onClick={handleDraw} disabled={busy} className="secondary-action">
              Draw
            </button>
          </div>
        )}
        {view && (
          <div className="mt-6">
            <ActionBar
              key={`${view.toActSeat}-${view.round?.currentBet}`}
              legalActions={view.you.legalActions}
              busy={busy}
              status={actionError ?? statusText(view)}
              onAction={handleAction}
            />
          </div>
        )}
        <div className="mt-6 text-center">
          <button type="button" onClick={leave} className="secondary-action">
            Leave table
          </button>
        </div>
      </div>
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

/* tells the player what pressing Draw will do, e.g. "Discarding 2 cards" */
function discardText(discarding: number, handSize: number): string {
  if (discarding === 0) return `Keeping all ${handSize} cards`
  return `Discarding ${discarding} ${discarding === 1 ? "card" : "cards"}`
}

function statusText(view: PlayerView): string {
  if (view.phase === "draw") {
    return view.toActSeat === view.you.seat ? "Pick cards to discard, then draw" : "Waiting for others to draw"
  }
  const toAct = view.toActSeat === null ? undefined : view.players[view.toActSeat]
  if (!toAct) return "Round over, waiting for next round"
  return toAct.seat === view.you.seat ? "Your turn" : `${toAct.name} to act`
}
