"use client"

import { announceBalance } from "@/service/BalanceService"
import { claimDailyReward, fetchDailyReward } from "@/service/RewardService"
import { DAILY_REWARDS } from "@shared/Rules"
import type { DailyRewardStatus } from "@shared/User"
import { useEffect, useState } from "react"

export default function DailyRewards() {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDailyReward().then(setStatus, () => {})
  }, [])

  async function claim() {
    setClaiming(true)
    try {
      const { balance } = await claimDailyReward()
      announceBalance(balance)
      setStatus(await fetchDailyReward())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setClaiming(false)
  }

  if (!status) return null

  return (
    <div className="flex items-center gap-4">
      {error && <p role="alert" className="text-sm font-medium text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]">{error}</p>}
      <div className="grid gap-2">
        <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[#d8cfcf]">Daily Rewards</p>
        <ol aria-label="Daily rewards" className="daily-chips">
          {DAILY_REWARDS.map((chips, i) => {
            const day = i + 1
            if (day === status.day && status.canClaim) {
              return (
                <li key={day}>
                  <button type="button" onClick={claim} disabled={claiming} aria-label={`Claim ${chips} chips`} title={`Day ${day}`} className="daily-chip today">
                    <span className="chip" />
                    {chips.toLocaleString()}
                  </button>
                </li>
              )
            }
            const next = day === status.day
            return (
              <li key={day} title={`Day ${day}: ${chips.toLocaleString()} chips`} className={`daily-chip ${day < status.day ? "claimed" : "locked"} ${next ? "next" : ""}`}>
                <span className="chip" />
                {next ? timeUntil(status.nextClaimAt!) : chips.toLocaleString()}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function timeUntil(date: string) {
  const minutes = Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 60000))
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`
}
