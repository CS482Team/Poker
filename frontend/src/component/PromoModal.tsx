"use client"

import type { PromoEvent } from "@shared/Event"

export default function PromoModal({ event, onClose }: { event: PromoEvent; onClose: () => void }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label="Event" className="w-full max-w-[560px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">Event</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-2 p-5">
          <p>
            Sit down at any table and get <span className="font-semibold text-[#e0a65e]">{event.multiplier}x</span> your buy-in in chips.
          </p>
          <p>Buy in with $100, start with ${Math.round(100 * event.multiplier)}.</p>
          <small className="text-[#9e9393]">Ends {new Date(event.expiresAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small>
        </div>
      </div>
    </div>
  )
}
