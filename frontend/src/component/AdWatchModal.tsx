"use client"

import type { Ad } from "@shared/Ad"
import { AD_WATCH_SECONDS } from "@shared/Rules"
import Icon, { CHECK, PLAY } from "@/component/Icon"
import { claimAd, startWatching } from "@/service/AdService"
import { useEffect, useState } from "react"

export default function AdWatchModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [started, setStarted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [reward, setReward] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startWatching(ad.id)
      .then(() => setStarted(true))
      .catch((err: Error) => setError(err.message))
  }, [ad.id])

  useEffect(() => {
    if (!started || seconds >= AD_WATCH_SECONDS) return
    const timer = setTimeout(() => setSeconds(seconds + 1), 1000)
    return () => clearTimeout(timer)
  }, [started, seconds])

  useEffect(() => {
    if (seconds !== AD_WATCH_SECONDS) return
    claimAd(ad.id)
      .then(setReward)
      .catch((err: Error) => setError(err.message))
  }, [seconds, ad.id])

  let message = `Watch ${AD_WATCH_SECONDS}s to earn $${ad.rewardAmount}`
  if (reward !== null) message = `You earned $${reward}!`
  if (error) message = error

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[640px] overflow-hidden rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="truncate text-lg font-bold">{ad.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid aspect-video place-items-center bg-black text-white/30">
          <Icon d={PLAY} size={56} />
        </div>
        <div className="h-1 bg-white/10">
          <div className="h-full bg-[#6fd099] transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(seconds / AD_WATCH_SECONDS, 1) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
          {seconds >= AD_WATCH_SECONDS ? (
            <span className="flex items-center gap-1.5 text-[#6fd099]">
              Watched <Icon d={CHECK} size={14} />
            </span>
          ) : (
            <span className="tabular-nums text-[#b5a9a9]">Watched {seconds}s</span>
          )}
          <span className={error ? "text-red-300" : reward !== null ? "font-semibold text-[#6fd099]" : "text-[#d8cfcf]"}>{message}</span>
        </div>
      </div>
    </div>
  )
}
