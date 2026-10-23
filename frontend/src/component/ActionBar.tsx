import { useState } from "react"
import type { ActionType, LegalAction } from "@/service/Game"

const BUTTON =
  "rounded-md border border-black/40 bg-gradient-to-b from-neutral-700 to-neutral-900 px-6 py-3 text-lg font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-50"

interface ActionBarProps {
  legalActions: LegalAction[] // empty when it isn't the viewer's turn
  busy: boolean
  status: string
  onAction: (type: ActionType, amount?: number) => void
}

// Fold / Check-or-Call / Bet-or-Raise, built from what the backend says is legal (S2).
// No-limit: the slider picks how much to bet or raise, between the allowed min and all-in.
export default function ActionBar({ legalActions, busy, status, onAction }: ActionBarProps) {
  const fold = legalActions.find(a => a.type === "fold")
  const check = legalActions.find(a => a.type === "check")
  const call = legalActions.find(a => a.type === "call")
  const aggressive = legalActions.find(a => a.type === "bet" || a.type === "raise")

  // The slider's chosen amount, kept inside the current allowed range
  const [chosen, setChosen] = useState<number | null>(null)
  const amount = aggressive?.type === "bet" || aggressive?.type === "raise"
    ? Math.min(Math.max(chosen ?? aggressive.min, aggressive.min), aggressive.max)
    : 0

  let aggressiveLabel = "Raise"
  if (aggressive?.type === "bet" || aggressive?.type === "raise") {
    if (amount === aggressive.max) aggressiveLabel = `All-in ${amount}`
    else aggressiveLabel = aggressive.type === "bet" ? `Bet ${amount}` : `Raise to ${amount}`
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button disabled={busy || !fold} onClick={() => onAction("fold")} className={`${BUTTON} text-fold`}>
          Fold
        </button>
        {check ? (
          <button disabled={busy} onClick={() => onAction("check")} className={BUTTON}>
            Check
          </button>
        ) : (
          <button disabled={busy || !call} onClick={() => onAction("call")} className={BUTTON}>
            {call?.type === "call" ? `Call ${call.amount}` : "Call"}
          </button>
        )}
        <input
          type="range"
          aria-label="Bet amount"
          disabled={busy || !aggressive}
          min={aggressive?.type === "bet" || aggressive?.type === "raise" ? aggressive.min : 0}
          max={aggressive?.type === "bet" || aggressive?.type === "raise" ? aggressive.max : 0}
          step={1}
          value={amount}
          onChange={e => setChosen(Number(e.target.value))}
          className="w-36 accent-raise"
        />
        <button
          disabled={busy || !aggressive}
          onClick={() => aggressive && onAction(aggressive.type, amount)}
          className={`${BUTTON} text-raise`}
        >
          {aggressiveLabel}
        </button>
      </div>
      <p className="text-sm text-white/60">{status}</p>
    </div>
  )
}
