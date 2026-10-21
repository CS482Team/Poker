"use client"

import { clearCurrentTableId } from "@/service/currentTableService"
import { watchHand, watchTable } from "@/service/socketService"
import { fetchTable, leaveTable } from "@/service/tableService"
import { getCurrentUserId } from "@/service/userService"
import PlayerHand from "@/component/PlayerHand"
import type { Card } from "@/util/Card"
import type { Table } from "@shared/table"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/* TODO better than this */
const seatPositions = [
  { left: "11%", top: "62%" },
  { left: "31%", top: "15%" },
  { left: "69%", top: "15%" },
  { left: "89%", top: "62%" },
  { left: "69%", top: "82%" },
  { left: "31%", top: "82%" },
]

export default function GameTable({ id }: { id: string }) {
  const router = useRouter()
  const [table, setTable] = useState<Table | null>(null)
  const [hand, setHand] = useState<Card[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTable(id)
      .then((loaded) => {
        setTable(loaded)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
    const stopTable = watchTable(id, setTable)
    const stopHand = watchHand(id, getCurrentUserId(), setHand)
    return () => {
      stopTable()
      stopHand()
    }
  }, [id])

  async function leave() {
    try {
      await leaveTable(id, getCurrentUserId())
      clearCurrentTableId()
      router.push("/")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (error) return <p className="p-8 text-center text-red-600">{error}</p>
  if (!table) return <p className="p-8 text-center">Loading table…</p>

  return (
    <div className="relative isolate mx-auto my-16 w-[90%] max-w-[940px]">
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
        <PlayerHand cards={hand} />
      </div>
      <div className="mt-6 text-center">
        <button type="button" onClick={leave} className="secondary-action">
          Leave table
        </button>
      </div>
    </div>
  )
}
