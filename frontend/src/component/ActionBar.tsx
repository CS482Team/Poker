import { useState } from "react"
import type { ActionType, LegalAction } from "@shared/Actions"

const BUTTON =
  "rounded-md border border-black/40 bg-gradient-to-b from-neutral-700 to-neutral-900 px-6 py-3 text-lg font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-50"

const BET_STEP = 5 // the slider moves in $5 steps; the amount box takes any whole amount

interface ActionBarProps {
  legalActions: LegalAction[] // empty when it isn't the viewer's turn
  busy: boolean
  status: string
  onAction: (type: ActionType, amount?: number) => void
}

/* The amounts the slider stops at: the minimum, every multiple of $5 in between, then all-in.
   e.g. min 2, max 63 → 2, 5, 10, ... 60, 63 */
export function betSteps(min: number, max: number): number[] {
  const steps = [min]
  for (let amount = Math.ceil((min + 1) / BET_STEP) * BET_STEP; amount < max; amount += BET_STEP) steps.push(amount)
  if (max > min) steps.push(max)
  return steps
}

// Fold / Check-or-Call / Bet-or-Raise, built from what the backend says is legal (S2).
// No-limit: the slider or the amount box picks how much to bet or raise, between the allowed min and all-in.
export default function ActionBar({ legalActions, busy, status, onAction }: ActionBarProps) {
  const fold = legalActions.find(a => a.type === "fold")
  const check = legalActions.find(a => a.type === "check")
  const call = legalActions.find(a => a.type === "call")
  const aggressive = legalActions.find(a => a.type === "bet" || a.type === "raise")
  const range = aggressive?.type === "bet" || aggressive?.type === "raise" ? aggressive : null

  // The chosen amount (from the slider or a valid typed amount), kept inside the allowed range
  const [chosen, setChosen] = useState<number | null>(null)
  // What's in the amount box while typing; null shows the chosen amount
  const [draft, setDraft] = useState<string | null>(null)

  const min = range?.min ?? 0
  const max = range?.max ?? 0
  const amount = range ? Math.min(Math.max(chosen ?? min, min), max) : 0
  const steps = range ? betSteps(min, max) : [0]
  // the slider sits on the first step at or above the amount (a typed amount can fall between steps)
  const stepIndex = Math.max(0, steps.findIndex(step => step >= amount))
  const typedOk = draft === null || isValidAmount(draft, min, max)
  const canBet = !busy && range !== null && typedOk

  let aggressiveLabel = "Raise"
  if (range) {
    if (amount === max) aggressiveLabel = `All-in $${amount}`
    else aggressiveLabel = range.type === "bet" ? `Bet $${amount}` : `Raise to $${amount}`
  }

  /* moves the slider to one of its $5 steps */
  function slideTo(index: number) {
    setChosen(steps[index] ?? min)
    setDraft(null)
  }

  /* keeps what's typed, and uses it once it's a whole amount in range */
  function typeAmount(text: string) {
    setDraft(text)
    if (isValidAmount(text, min, max)) setChosen(Number(text))
  }

  function placeBet() {
    if (canBet && range) onAction(range.type, amount)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button disabled={busy || !fold} onClick={() => onAction("fold")} className={`${BUTTON} text-[#f0503c]`}>
          Fold
        </button>
        {check ? (
          <button disabled={busy} onClick={() => onAction("check")} className={BUTTON}>
            Check
          </button>
        ) : (
          <button disabled={busy || !call} onClick={() => onAction("call")} className={BUTTON}>
            {call?.type === "call" ? `Call $${call.amount}` : "Call"}
          </button>
        )}
        {/* the slider moves through step positions; aria-valuetext reads out the dollar amount */}
        <input
          type="range"
          aria-label="Bet size"
          aria-valuetext={`$${amount}`}
          disabled={busy || !range}
          min={0}
          max={steps.length - 1}
          step={1}
          value={stepIndex}
          onChange={e => slideTo(Number(e.target.value))}
          className="w-36 accent-[#3fd94f]"
        />
        <label className="flex h-12 items-center rounded-md border border-panel-edge bg-panel-sunken pl-2 text-lg text-ink focus-within:outline-2 focus-within:outline-[#3fd94f] has-[:disabled]:opacity-50">
          <span aria-hidden className="text-ink-muted">$</span>
          <input
            type="number"
            inputMode="numeric"
            aria-label="Bet amount"
            aria-invalid={!typedOk}
            disabled={busy || !range}
            min={min}
            max={max}
            step={1}
            value={draft ?? (range ? amount : "")}
            onChange={e => typeAmount(e.target.value)}
            onBlur={() => setDraft(null)}
            onKeyDown={e => e.key === "Enter" && placeBet()}
            className="w-20 bg-transparent px-1 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </label>
        <button disabled={!canBet} onClick={placeBet} className={`${BUTTON} text-[#3fd94f]`}>
          {aggressiveLabel}
        </button>
      </div>
      {!typedOk ? (
        <p role="alert" className="text-sm text-red-400">
          Enter ${min} to ${max}
        </p>
      ) : (
        <p className="text-sm text-white/60">{status}</p>
      )}
    </div>
  )
}

/* a whole number of chips between the min bet and all-in */
function isValidAmount(text: string, min: number, max: number) {
  const value = Number(text)
  return text.trim() !== "" && Number.isInteger(value) && value >= min && value <= max
}
