"use client"

import { fetchTable } from "@/service/tableService"
import type { TableDetail } from "@shared/table"
import { useEffect, useState } from "react"

const seatPositions = [
  { left: "11%", top: "62%" },
  { left: "31%", top: "15%" },
  { left: "69%", top: "15%" },
  { left: "89%", top: "62%" },
  { left: "69%", top: "82%" },
  { left: "31%", top: "82%" },
]

export default function GameTable({ id }: { id: string }) {
  const [table, setTable] = useState<TableDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTable(id)
      .then(setTable)
      .catch((err: Error) => setError(err.message))
  }, [id])

  if (error) return <p className="p-8 text-center text-red-600">{error}</p>
  if (!table) return <p className="p-8 text-center">Loading table…</p>

  return (
    <div className="relative isolate mx-auto my-16 w-[90%] max-w-[940px]">
      <div className="poker-table relative h-[436px] rounded-[44%/50%]">
        <div className="table-line absolute inset-[26px] rounded-[44%/50%]" />
        {table.seats.map((seat) => (
          <div
            key={seat.userId}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={seatPositions[seat.seatNumber]}
          >
            <div className="seat-portrait">{seat.username[0]}</div>
            <div className="seat-label">
              <span>{seat.username}</span>
              <small>${seat.stack.toLocaleString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
