"use client"

import Stepper from "@/component/Stepper"
import { updateTableSettings } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"
import type { Table } from "@shared/Table"
import { useState } from "react"

const labelClass = "grid gap-1.5 text-sm text-[#b5a9a9]"
const boxClass = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef]"

export default function RoomSettings({ table, onClose }: { table: Table; onClose: () => void }) {
  const [name, setName] = useState(table.name)
  const [botCount, setBotCount] = useState(table.botCount)
  const [chatEnabled, setChatEnabled] = useState(table.chatEnabled)
  const [turnTimerEnabled, setTurnTimerEnabled] = useState(table.turnTimerEnabled)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateTableSettings(table.id, getCurrentUserId(), { name, botCount, chatEnabled, turnTimerEnabled })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form onSubmit={save} role="dialog" aria-label="Room settings" className="w-full max-w-[460px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Room Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <label className={`${labelClass} sm:col-span-3`}>
            Room Name
            <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className={boxClass} />
          </label>
          <Stepper label="Bots" value={botCount} min={0} max={table.maxPlayers - table.seats.length} onChange={setBotCount} />
          <label className={labelClass}>
            Chat
            <span className={`${boxClass} flex items-center justify-between`}>
              {chatEnabled ? "On" : "Off"}
              <input type="checkbox" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} />
            </span>
          </label>
          <label className={labelClass}>
            Turn Timer
            <span className={`${boxClass} flex items-center justify-between`}>
              {turnTimerEnabled ? "On" : "Off"}
              <input type="checkbox" checked={turnTimerEnabled} onChange={(e) => setTurnTimerEnabled(e.target.checked)} />
            </span>
          </label>
          <p className="text-sm text-[#b5a9a9] sm:col-span-3">Some settings only take effect next round.</p>
          {error && <p className="text-sm text-red-400 sm:col-span-3">{error}</p>}
          <div className="mt-3 flex justify-end sm:col-span-3">
            <button type="submit" disabled={saving} className="primary-action">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
