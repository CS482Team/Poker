"use client"

import { fetchMyHands } from "@/service/HistoryService"
import type { HandRecord } from "@shared/PlayerHistory"
import { useEffect, useState } from "react"

export default function HistoryPage() {
  const [hands, setHands] = useState<HandRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyHands()
      .then(setHands)
      .catch((err: Error) => setError(err.message.includes("401") ? "Sign in to see your game history." : err.message))
  }, [])

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Game history</h1>
      </div>
      <section className="panel p-5">
        {error && <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {hands === null && !error && <p className="py-6 text-center text-sm text-[#9e9393]">Loading…</p>}
        {hands?.length === 0 && <p className="py-6 text-center text-sm text-[#9e9393]">No hands yet.</p>}
        <ul>
          {hands?.map((hand) => (
            <li key={hand.matchId} className="flex items-center justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
              <div className="min-w-0">
                <p className="truncate">
                  <span className={resultColor(hand.netResult)}>{resultText(hand.netResult)}</span>
                  {` at ${hand.tableName}`}
                </p>
                <small>
                  Hand #{hand.handNumber} · Pot ${hand.pot.toLocaleString()}
                  {hand.winner && ` · Won by ${hand.winner}`}
                </small>
              </div>
              <small className="whitespace-nowrap">{formatTime(hand.endedAt)}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function resultColor(net: number) {
  if (net > 0) return "text-[#6fd099]"
  if (net < 0) return "text-red-300"
  return ""
}

function resultText(net: number) {
  if (net > 0) return `Won $${net.toLocaleString()}`
  if (net < 0) return `Lost $${(-net).toLocaleString()}`
  return "Broke even"
}

function formatTime(date: string) {
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}