"use client"

import { setCurrentTableId } from "@/service/CurrentTableService"
import { createTable, joinTable } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"
import { MAX_PLAYERS, MIN_PLAYERS } from "@shared/Rules"
import { useRouter } from "next/navigation"
import { useState } from "react"

const seatOptions = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i)

const labelClass = "grid gap-1.5 text-sm text-[#b5a9a9]"
const inputClass = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef] [color-scheme:dark]"
const numberClass = `${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`

export default function NewTableForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(MAX_PLAYERS)
  const [buyIn, setBuyIn] = useState(100)
  const [minimumBet, setMinimumBet] = useState(10)
  const [ante, setAnte] = useState(5)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const id = await createTable({ hostId: getCurrentUserId(), name, maxPlayers, buyIn, minimumBet, ante })
      await joinTable(id, getCurrentUserId())
      setCurrentTableId(id)
      router.push(`/table/${id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">New table</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Table name
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Seats
            <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} className={inputClass}>
              {seatOptions.map((n) => (
                <option key={n} value={n} className="bg-[#181414]">
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Buy in
            <input type="number" min={1} required value={buyIn} onChange={(e) => setBuyIn(Number(e.target.value))} className={numberClass} />
          </label>
          <label className={labelClass}>
            Ante
            <input type="number" min={0} required value={ante} onChange={(e) => setAnte(Number(e.target.value))} className={numberClass} />
          </label>
          <label className={labelClass}>
            Min bet
            <input type="number" min={0} required value={minimumBet} onChange={(e) => setMinimumBet(Number(e.target.value))} className={numberClass} />
          </label>
          {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={onCancel} className="secondary-action">
              Cancel
            </button>
            <button type="submit" className="primary-action">
              Create
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
