"use client"

import Stepper from "@/component/common/Stepper"
import { createEvent, endEvent, fetchActiveEvent } from "@/service/EventService"
import type { PromoEvent } from "@shared/Event"
import { useEffect, useState } from "react"

export default function PromoManager() {
  const [event, setEvent] = useState<PromoEvent | null>(null)
  const [name, setName] = useState("")
  const [multiplier, setMultiplier] = useState(2)
  const [days, setDays] = useState(3)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveEvent()
      .then(setEvent)
      .catch((err: Error) => setError(err.message))
  }, [])

  async function run(action: () => Promise<void>) {
    try {
      await action()
      setEvent(await fetchActiveEvent())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function start(e: React.FormEvent) {
    e.preventDefault()
    run(() => createEvent(name.trim(), multiplier, days))
  }

  return (
    <section className="panel padded">
      <div className="panel-head">
        <h2>Promo Event</h2>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {event ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-white/[.06] text-xl font-bold text-[#e0a65e]">{event.multiplier}X</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{event.name}</p>
              <p className="text-sm text-[#9e9393]">Ends {new Date(event.expiresAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </div>
          </div>
          <button type="button" onClick={() => run(() => endEvent(event.id))} className="secondary-action small danger">
            End
          </button>
        </div>
      ) : (
        <form onSubmit={start} className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
          <label className="grid gap-1.5 text-sm text-[#b5a9a9]">
            Name
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef]" />
          </label>
          <Stepper label="Multiplier" value={multiplier} min={1.1} max={3} step={0.1} onChange={(value) => setMultiplier(Math.round(value * 10) / 10)} />
          <Stepper label="Days" value={days} min={1} max={30} onChange={setDays} />
          <button type="submit" className="primary-action">
            Start
          </button>
        </form>
      )}
    </section>
  )
}
