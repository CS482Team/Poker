"use client"

import Avatar from "@/component/Avatar"
import { fetchLeaderboard } from "@/service/LeaderboardService"
import type { Leaderboard as Board, LeaderboardEntry, MyStanding, Timeframe } from "@shared/Leaderboard"
import { LEADERBOARD_SIZE } from "@shared/Rules"
import { useEffect, useState } from "react"

const TIMEFRAMES: { value: Timeframe; label: string; during: string }[] = [
  { value: "week", label: "Weekly", during: "this week" },
  { value: "month", label: "Monthly", during: "this month" },
  { value: "season", label: "Season", during: "this season" },
  { value: "all", label: "All-Time", during: "in total" },
]

const MUTED = "text-ink-muted"
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a3a5]"

type Result = { key: string; board: Board } | { key: string; error: string }

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week")
  const [reloads, setReloads] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const key = `${timeframe}:${reloads}`

  useEffect(() => {
    let current = true // ignore a slow answer for a timeframe the player already left
    fetchLeaderboard(timeframe)
      .then((board) => current && setResult({ key, board }))
      .catch((err: Error) => current && setResult({ key, error: err.message }))
    return () => {
      current = false
    }
  }, [timeframe, key])

  const shown = result?.key === key ? result : null
  const board = shown && "board" in shown ? shown.board : null
  const during = TIMEFRAMES.find((t) => t.value === timeframe)!.during

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <div role="group" aria-label="Timeframe" className="flex flex-wrap gap-1 rounded-lg border border-panel-edge bg-panel-sunken p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={timeframe === t.value}
              onClick={() => setTimeframe(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${FOCUS} ${timeframe === t.value ? "bg-panel-mine text-ink" : `${MUTED} hover:text-ink`}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="panel p-5" aria-busy={!shown}>
        {board && <PeriodLine board={board} onRefresh={() => setReloads((n) => n + 1)} />}
        <Rules minHands={board?.minHands} comparedTo={board?.comparedTo} />
        {shown && "error" in shown && (
          <div className="my-4 flex items-center justify-between gap-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {shown.error}
            <button type="button" onClick={() => setReloads((n) => n + 1)} className={`underline ${FOCUS}`}>
              Try again
            </button>
          </div>
        )}
        {!shown && <Skeleton />}
        {board?.me && <Standing me={board.me} totalRanked={board.totalRanked} during={during} />}
        {board && board.totalRanked === 0 && (
          <p className="py-8 text-center text-sm text-ink-muted">
            No one has qualified {during} yet. Play {board.minHands} hands to get on the board.
          </p>
        )}
        {board && board.totalRanked > 0 && <Standings board={board} />}
        {board && !board.me && (
          <p className={`mt-3 text-sm ${MUTED}`}>Signed-up players are ranked once they&apos;ve played {board.minHands} hands {during}.</p>
        )}
      </section>
    </div>
  )
}

/* which dates these standings cover, when they were worked out, and a refresh button */
function PeriodLine({ board, onRefresh }: { board: Board; onRefresh: () => void }) {
  const lastDay = new Date(new Date(board.periodEnd).getTime() - 1) // the end is exclusive
  const range = board.periodStart ? `${day(board.periodStart, false)} – ${day(lastDay, true)}` : `Every hand through ${day(lastDay, true)}`
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-lg font-bold">
        {board.label} <span className={`text-sm font-normal ${MUTED}`}>{range} (UTC)</span>
      </h2>
      <p className={`flex items-center gap-2 text-xs ${MUTED}`}>
        Last updated {new Date(board.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        <button type="button" onClick={onRefresh} className={`rounded px-1 underline hover:text-ink ${FOCUS}`}>
          Refresh
        </button>
      </p>
    </div>
  )
}

/* the scoring formula, qualifying rule and tiebreakers, folded away until asked for */
function Rules({ minHands, comparedTo }: { minHands?: number; comparedTo?: string }) {
  return (
    <details className="mb-4 rounded-md border border-panel-edge bg-panel-sunken px-3 py-2 text-sm">
      <summary className={`cursor-pointer font-semibold ${FOCUS}`}>How ranking works</summary>
      <ul className={`mt-2 list-disc space-y-1 pl-5 ${MUTED}`}>
        <li><strong className="text-ink">Balance</strong> is each player&apos;s chips right now. It&apos;s shown for reference; the ranking uses net winnings for the period.</li>
        <li><strong className="text-ink">Score:</strong> net winnings, the chips you won minus the chips you put in (antes, bets and calls) across hands finished in the period.</li>
        <li><strong className="text-ink">Qualifying:</strong> play at least {minHands ?? "a minimum number of"} hands in the period. Guests aren&apos;t ranked.</li>
        <li><strong className="text-ink">Ties:</strong> more hands won ranks higher, then fewer hands played. Players still level share a rank.</li>
        <li><strong className="text-ink">Movement:</strong> places gained or lost since {comparedTo ?? "the previous period"}. <em>New</em> means you weren&apos;t ranked then.</li>
        <li><strong className="text-ink">Periods</strong> reset in UTC: weeks on Monday, months on the 1st, seasons every quarter (January, April, July, October).</li>
      </ul>
    </details>
  )
}

/* the signed-in player's rank, or what they need to qualify, and the chips to the next places */
function Standing({ me, totalRanked, during }: { me: MyStanding; totalRanked: number; during: string }) {
  const goals = [
    me.nextRank && `${me.nextRank.chipsNeeded.toLocaleString()} chips to pass #${me.nextRank.rank}`,
    me.topTier && `${me.topTier.chipsNeeded.toLocaleString()} to reach the top ${LEADERBOARD_SIZE}`,
  ].filter(Boolean)
  return (
    <div aria-label="Your standing" role="status" className="mb-4 rounded-md border border-panel-edge bg-panel-raised px-3 py-2 text-sm">
      {me.entry ? (
        <>
          <strong>You&apos;re #{me.entry.rank}</strong> of {totalRanked}
          <span className={MUTED}> · Balance ${me.balance.toLocaleString()}</span>
          {goals.length > 0 ? <span className={MUTED}> · {goals.join(" · ")}</span> : <span className={MUTED}> · top of the board</span>}
        </>
      ) : (
        <>
          <strong>Play {me.handsToQualify} more {me.handsToQualify === 1 ? "hand" : "hands"} {during} to get ranked</strong>
          <span className={MUTED}> · {me.handsPlayed} played so far · Balance ${me.balance.toLocaleString()}</span>
        </>
      )}
    </div>
  )
}

function Standings({ board }: { board: Board }) {
  const mine = board.me?.entry ?? null
  const pinned = mine && !board.top.some((e) => e.userId === mine.userId) ? mine : null
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{board.label} leaderboard, ranked by net winnings</caption>
        <thead>
          <tr className={`text-left text-xs uppercase tracking-wide ${MUTED}`}>
            <th scope="col" className="px-2 py-2">Rank</th>
            <th scope="col" className="px-2 py-2">Player</th>
            <th scope="col" className="px-2 py-2 text-right">Net</th>
            <th scope="col" className="px-2 py-2 text-right">Balance</th>
            <th scope="col" className="hidden px-2 py-2 text-right sm:table-cell">Hands</th>
            <th scope="col" className="hidden px-2 py-2 text-right sm:table-cell">Won</th>
            <th scope="col" className="px-2 py-2 text-right">Win %</th>
          </tr>
        </thead>
        <tbody>
          {board.top.map((entry) => (
            <Row key={entry.userId} entry={entry} isMe={entry.userId === mine?.userId} comparedTo={board.comparedTo} />
          ))}
        </tbody>
        {pinned && (
          <tbody aria-label="Your rank" className="border-t-2 border-panel-edge">
            <Row entry={pinned} isMe comparedTo={board.comparedTo} />
          </tbody>
        )}
      </table>
    </div>
  )
}

function Row({ entry, isMe, comparedTo }: { entry: LeaderboardEntry; isMe: boolean; comparedTo: string }) {
  return (
    <tr aria-current={isMe ? "true" : undefined} className={`border-b border-white/5 last:border-0 ${isMe ? "bg-panel-mine/60" : ""}`}>
      <td className="whitespace-nowrap px-2 py-2.5">
        <span className="inline-block w-8 font-semibold tabular-nums">#{entry.rank}</span>
        <Movement movement={entry.movement} comparedTo={comparedTo} />
      </td>
      <td className="px-2 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={entry.username} url={entry.avatarUrl} className="size-8" />
          <span className={`truncate ${isMe ? "font-bold" : ""}`}>{entry.username}</span>
          {isMe && <span className={`text-xs ${MUTED}`}>(you)</span>}
        </span>
      </td>
      <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${netColor(entry.netWinnings)}`}>{signed(entry.netWinnings)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">${entry.balance.toLocaleString()}</td>
      <td className="hidden px-2 py-2.5 text-right tabular-nums sm:table-cell">{entry.handsPlayed}</td>
      <td className="hidden px-2 py-2.5 text-right tabular-nums sm:table-cell">{entry.handsWon}</td>
      <td className="px-2 py-2.5 text-right tabular-nums">{Math.round(entry.winRate * 100)}%</td>
    </tr>
  )
}

/* +2 / -1 / – next to the rank, read out in full by screen readers */
function Movement({ movement, comparedTo }: { movement: number | null; comparedTo: string }) {
  let shown = "–"
  let spoken = `No change since ${comparedTo}`
  let color = MUTED
  if (movement === null) {
    shown = "New"
    spoken = `Newly ranked since ${comparedTo}`
    color = "text-[#e8c66f]"
  } else if (movement > 0) {
    shown = `+${movement}`
    spoken = `Up ${places(movement)} since ${comparedTo}`
    color = "text-[#6fd099]"
  } else if (movement < 0) {
    shown = `${movement}`
    spoken = `Down ${places(-movement)} since ${comparedTo}`
    color = "text-red-300"
  }
  return (
    <span className={`ml-1 text-xs font-semibold ${color}`}>
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  )
}

/* grey placeholder rows while the standings load */
function Skeleton() {
  return (
    <div role="status" className="space-y-3 py-2">
      <span className="sr-only">Loading leaderboard…</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} aria-hidden className="flex items-center gap-3 motion-safe:animate-pulse">
          <div className="h-4 w-8 rounded bg-panel-raised" />
          <div className="size-8 rounded-full bg-panel-raised" />
          <div className="h-4 flex-1 rounded bg-panel-raised" />
          <div className="h-4 w-16 rounded bg-panel-raised" />
        </div>
      ))}
    </div>
  )
}

function places(n: number) {
  return n === 1 ? "1 place" : `${n} places`
}

/* net winnings as money: +$1,250, −$300, $0 */
function signed(n: number) {
  return n > 0 ? `+$${n.toLocaleString()}` : n < 0 ? `−$${(-n).toLocaleString()}` : "$0"
}

function netColor(n: number) {
  if (n > 0) return "text-[#6fd099]"
  if (n < 0) return "text-red-300"
  return ""
}

/* a UTC calendar day, e.g. "Nov 23" or "Nov 29, 2026" */
function day(date: string | Date, withYear: boolean) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: withYear ? "numeric" : undefined, timeZone: "UTC" })
}
