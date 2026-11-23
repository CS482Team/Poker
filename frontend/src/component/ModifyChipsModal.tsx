"use client"

import Stepper from "@/component/Stepper"
import { modifyChips } from "@/service/AdminService"
import type { PlayerSummary } from "@shared/PlayerHistory"
import { useState } from "react"

export default function ModifyChipsModal({ player, onCancel, onSaved }: { player: PlayerSummary; onCancel: () => void; onSaved: (balance: number) => void }) {
  const [balance, setBalance] = useState(player.balance)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await modifyChips(player.id, balance)
      onSaved(balance)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form onSubmit={save} className="w-full max-w-[400px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">Modify Chips</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <Stepper label={`Balance for ${player.username}`} value={balance} min={0} max={Infinity} step={10} onChange={setBalance} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" className="primary-action small">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
