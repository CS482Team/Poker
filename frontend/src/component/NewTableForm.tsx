"use client"

import { setCurrentTableId } from "@/service/CurrentTableService"
import { createTable, joinTable } from "@/service/TableService"
import { fetchUsername, getCurrentUserId } from "@/service/UserService"
import { MAX_PLAYERS, MIN_PLAYERS } from "@shared/Rules"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const labelClass = "grid gap-1.5 text-sm text-[#b5a9a9]"
const inputClass = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef] [color-scheme:dark]"
const numberClass = `${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`

function Money({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative">
      {children}
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#b5a9a9]">$</span>
    </span>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className={labelClass}>
      {label}
      <div className="flex items-center rounded-lg border border-white/10 bg-black/40 pr-1.5 text-[#f5f2ef]">
        <span className="flex-1 px-3 py-2">{value}</span>
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-8 w-7 place-items-center rounded-md text-lg leading-none hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
          −
        </button>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-8 w-7 place-items-center rounded-md text-lg leading-none hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
          +
        </button>
      </div>
    </div>
  )
}

export default function NewTableForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(MAX_PLAYERS)
  const [buyIn, setBuyIn] = useState(100)
  const [minimumBet, setMinimumBet] = useState(10)
  const [ante, setAnte] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [botCount, setBotCount] = useState(0)

  function changeSeats(seats: number) {
    setMaxPlayers(seats)
    setBotCount(Math.min(botCount, seats - 1))
  }

  useEffect(() => {
    fetchUsername(getCurrentUserId())
      .then((username) => setName((current) => current || `${username}'s room`))
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const id = await createTable({ hostId: getCurrentUserId(), name, maxPlayers, buyIn, minimumBet, ante, botCount })
      await joinTable(id, getCurrentUserId())
      setCurrentTableId(id)
      router.push(`/table/${id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form onSubmit={submit} className="w-full max-w-[460px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">New Table</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Table Name
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <Stepper label="Seats" value={maxPlayers} min={MIN_PLAYERS} max={MAX_PLAYERS} onChange={changeSeats} />
          <Stepper label="Bots" value={botCount} min={0} max={maxPlayers - 1} onChange={setBotCount} />
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
            <label className={labelClass}>
              Buy In
              <Money>
                <input type="number" min={1} required value={buyIn} onChange={(e) => setBuyIn(Number(e.target.value))} className={`${numberClass} pl-7`} />
              </Money>
            </label>
            <label className={labelClass}>
              Ante
              <Money>
                <input type="number" min={0} required value={ante} onChange={(e) => setAnte(Number(e.target.value))} className={`${numberClass} pl-7`} />
              </Money>
            </label>
            <label className={labelClass}>
              Min Bet
              <Money>
                <input type="number" min={0} required value={minimumBet} onChange={(e) => setMinimumBet(Number(e.target.value))} className={`${numberClass} pl-7`} />
              </Money>
            </label>
          </div>
          {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
          <div className="mt-3 flex justify-end sm:col-span-2">
            <button type="submit" className="primary-action">
              Create
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
