"use client"

import type { PromoEvent } from "@shared/Event"

export default function PromoModal({ event, onClose }: { event: PromoEvent; onClose: () => void }) {
  const start = Math.round(100 * event.multiplier)

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label="Event" className="w-full max-w-[560px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="truncate text-xl font-bold">Event</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-5 p-6">
          <p className="text-xl font-semibold">
            <span className="text-[#e0a65e]">{event.multiplier}X</span> Chip Multiplier
          </p>
          <p className="leading-relaxed text-[#d8cfcf]">
            Every table you join this event starts you with {event.multiplier === 2 ? "double" : `${event.multiplier}x`} your buy-in. Buy in for $100, play with ${start}. The extra ${start - 100} stays at the
            table when you leave, but anything you win is yours to keep.
          </p>
          <p className="border-t border-white/10 pt-4 text-sm text-[#9e9393]">Ends {new Date(event.expiresAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  )
}
