"use client"

import ActionBar from "@/component/ActionBar"
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

/* TODO better than this */
const seatPositions = [
  { left: "9%", top: "51%" },
  { left: "30%", top: "7%" },
  { left: "70%", top: "7%" },
  { left: "91%", top: "51%" },
  { left: "70%", top: "84%" },
  { left: "30%", top: "84%" },
]

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
      router.push("/")
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
    <div className="relative isolate mx-auto my-16 w-[90%] max-w-[780px]">
      <div className="poker-table relative h-[436px] rounded-[44%/50%]">
        <div className="table-line absolute inset-[26px] rounded-[44%/50%]" />
        {table.seats.map((seat) => {
          const name = seat.userId === getCurrentUserId() ? "Me" : seat.username
          return (
            <div
              key={seat.userId}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={seatPositions[seat.seatNumber]}
            >
              <div className="seat-portrait">{name[0]}</div>
              <div className="seat-label">
                <span>{name}</span>
                <small>${seat.stack.toLocaleString()}</small>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-6">
        <PlayerHand
          cards={view?.you.hand ?? []}
          selected={selected}
          canSelect={canDraw && !busy}
          onToggle={toggleCard}
        />
      </div>
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
  )
}

function statusText(view: PlayerView): string {
  if (view.phase === "draw") {
    return view.toActSeat === view.you.seat ? "Pick cards to discard, then draw" : "Waiting for others to draw"
  }
  if (view.phase === "showdown") return "Betting over: showdown is next"
  const toAct = view.toActSeat === null ? undefined : view.players[view.toActSeat]
  if (!toAct) return "Waiting for the next round"
  return toAct.seat === view.you.seat ? "Your turn" : `${toAct.name} to act`
}
