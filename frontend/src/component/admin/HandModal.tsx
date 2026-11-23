"use client"

import HandCard from "@/component/admin/HandCard"
import { fetchHand } from "@/service/AdminService"
import type { ReportHand } from "@shared/Report"
import { useEffect, useState } from "react"

export default function HandModal({ matchId, tableName, onClose }: { matchId: string; tableName: string; onClose: () => void }) {
  const [hand, setHand] = useState<ReportHand | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHand(matchId)
      .then(setHand)
      .catch((err: Error) => setError(err.message))
  }, [matchId])

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label="Hand" className="flex max-h-[min(640px,85vh)] w-full max-w-[720px] flex-col rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-lg font-bold">{tableName}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {!hand && !error && <p className="py-10 text-center text-sm text-[#9e9393]">Loading…</p>}
          {hand && <HandCard hand={hand} />}
        </div>
      </div>
    </div>
  )
}
