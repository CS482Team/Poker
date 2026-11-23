"use client"

import type { PlayerSummary } from "@shared/PlayerHistory"

export default function BanModal({ player, onCancel, onBan }: { player: PlayerSummary; onCancel: () => void; onBan: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label={`Ban ${player.username}`} className="w-full max-w-[400px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">Ban {player.username}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <p className="text-sm text-[#b5a9a9]">{player.username} won&apos;t be able to log in or play.</p>
          <div className="flex justify-end">
            <button type="button" onClick={onBan} className="secondary-action small danger">
              Ban
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
