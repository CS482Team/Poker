"use client"

import ActionBar from "@/component/ActionBar"
import ChatPanel from "@/component/ChatPanel"
import Dots from "@/component/Dots"
import Icon, { LEAVE } from "@/component/Icon"
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
          <div className="flex items-center gap-3">
            <button type="button" onClick={leave} className="secondary-action small gap-1.5">
              <Icon d={LEAVE} size={14} />
              Leave
            </button>
            <h1 className="text-3xl font-bold">{table.name}</h1>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#d8cfcf]">
            <span>Min bet <b className="ml-1 text-base text-white">${table.minimumBet}</b></span>
            <span>Ante <b className="ml-1 text-base text-white">${table.ante}</b></span>
            <span>Buy-in <b className="ml-1 text-base text-white">${table.buyIn}</b></span>
            <span>Max players <b className="ml-1 text-base text-white">{table.maxPlayers}</b></span>
          </div>
        </div>
        <div className="poker-table relative h-[436px] rounded-[44%/50%]">
          <div className="table-line absolute inset-[26px] rounded-[44%/50%]" />
          {view && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
              <span className="text-lg text-[#d8cfcf]">Pot </span>
              <span className="text-3xl font-bold text-white">${view.pot}</span>
            </div>
          )}
          {view && (
            <p className={`absolute bottom-[72px] left-1/2 -translate-x-1/2 whitespace-nowrap text-base ${actionError ? "text-red-300" : "text-white/75"}`}>
              <span>{actionError ?? statusText(view)}</span>
              {!actionError && view.toActSeat !== view.you.seat && <Dots />}
            </p>
          )}
          {[...table.seats].sort((a, b) => a.seatNumber - b.seatNumber).map((seat, i) => {
            const name = seat.userId === getCurrentUserId() ? "Me" : seat.username
            const live = view?.players.find((p) => p.id === seat.userId)
            const won = view?.winners.includes(seat.userId)
            return (
              <div
                key={seat.userId}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                style={seatPosition(i, table.seats.length)}
              >
                {won && (
                  <svg viewBox="0 0 24 16" fill="#e8b84a" aria-label="Winner" className="absolute -top-6 left-1/2 h-5 w-7 -translate-x-1/2">
                    <path d="M0 16 L2 4 L7 9 L12 0 L17 9 L22 4 L24 16 Z" />
                  </svg>
                )}
                <div className="seat-portrait" style={won ? { borderColor: "#e8b84a" } : undefined}>
                  {name[0]}
                </div>
                <div className="seat-label">
                  <span>{name}</span>
                  <small>${(live?.stack ?? seat.stack).toLocaleString()}</small>
                </div>
                {live && live.betThisRound > 0 && <small>Bet ${live.betThisRound}</small>}
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
        {canDraw && (
          <div className="mt-6 text-center">
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
              onAction={handleAction}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function statusText(view: PlayerView): string {
  if (view.phase === "draw") {
    return view.toActSeat === view.you.seat ? "Pick cards to discard, then draw" : "Waiting for others to draw"
  }
  const toAct = view.toActSeat === null ? undefined : view.players[view.toActSeat]
  if (!toAct) return "Round over, waiting for next round"
  return toAct.seat === view.you.seat ? "Your turn" : `${toAct.name} to act`
}
