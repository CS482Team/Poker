"use client"

import { updateTableSettings } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"
import type { Table } from "@shared/Table"
import { useState } from "react"

export default function RoomSettings({ table, onClose }: { table: Table; onClose: () => void }) {
  const [name, setName] = useState(table.name)
  const [botCount, setBotCount] = useState(table.botCount)
  const [chatEnabled, setChatEnabled] = useState(table.chatEnabled)
  const [turnTimerEnabled, setTurnTimerEnabled] = useState(table.turnTimerEnabled)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
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
    <div className="crud-modal-backdrop">
      <div className="crud-modal" role="dialog" aria-label="Room settings">
        <div>
          <h2>Room settings</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <div className="grid gap-4">
          <label className="crud-field">
            <span>Room name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>

          <label className="crud-field">
            <span>Bots (added from the next hand)</span>
            <select value={botCount} onChange={(e) => setBotCount(Number(e.target.value))}>
              {Array.from({ length: table.maxPlayers }, (_, n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <div className="setting-row">
            <span><strong>Chat</strong></span>
            <input type="checkbox" aria-label="Chat" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} />
          </div>

          <div className="setting-row">
            <span><strong>Turn timer</strong></span>
            <input type="checkbox" aria-label="Turn timer" checked={turnTimerEnabled} onChange={(e) => setTurnTimerEnabled(e.target.checked)} />
          </div>

          {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" className="secondary-action" onClick={onClose}>Cancel</button>
            <button type="button" className="primary-action" onClick={save} disabled={saving || name.trim() === ""}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}