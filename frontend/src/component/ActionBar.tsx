import { useState } from "react"
import type { ActionType, LegalAction } from "@shared/Actions"

const BUTTON =
  "rounded-md border border-black/40 bg-gradient-to-b from-neutral-700 to-neutral-900 px-6 py-3 text-lg font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-50"

// the small square - and + buttons beside the amount box
const STEP_BUTTON =
  "h-12 w-12 rounded-md border border-black/40 bg-gradient-to-b from-neutral-700 to-neutral-900 text-2xl font-semibold leading-none shadow-lg disabled:cursor-not-allowed disabled:opacity-50"

const BET_STEP = 5 // - and + move in $5 steps; the amount box takes any whole amount

interface ActionBarProps {
  legalActions: LegalAction[] // empty when it isn't the viewer's turn
  busy: boolean
  status: string
  onAction: (type: ActionType, amount?: number) => void
}

/* The amounts - and + step through: the minimum, every multiple of $5 in between, then all-in.
   e.g. min 2, max 63 → 2, 5, 10, ... 60, 63 */
export function betSteps(min: number, max: number): number[] {
  const steps = [min]
  for (let amount = Math.ceil((min + 1) / BET_STEP) * BET_STEP; amount < max; amount += BET_STEP) steps.push(amount)
  if (max > min) steps.push(max)
  return steps
}

// Fold / Check-or-Call / Bet-or-Raise, built from what the backend says is legal (S2).
// No-limit: the - and + buttons or the amount box pick how much to bet or raise, between the allowed min and all-in.
export default function ActionBar({ legalActions, busy, status, onAction }: ActionBarProps) {
  const fold = legalActions.find(a => a.type === "fold")
  const check = legalActions.find(a => a.type === "check")
  const call = legalActions.find(a => a.type === "call")
  const aggressive = legalActions.find(a => a.type === "bet" || a.type === "raise")
  const range = aggressive?.type === "bet" || aggressive?.type === "raise" ? aggressive : null

  // The chosen amount (from - and + or a valid typed amount), kept inside the allowed range
  const [chosen, setChosen] = useState<number | null>(null)
  // What's in the amount box while typing; null shows the chosen amount
  const [draft, setDraft] = useState<string | null>(null)

  const min = range?.min ?? 0
  const max = range?.max ?? 0
  const amount = range ? Math.min(Math.max(chosen ?? min, min), max) : 0
  const steps = range ? betSteps(min, max) : [0]
  const typedOk = draft === null || isValidAmount(draft, min, max)
  const canBet = !busy && range !== null && typedOk

  let aggressiveLabel = "Raise"
  if (range) {
    if (amount === max) aggressiveLabel = `All-in $${amount}`
    else aggressiveLabel = range.type === "bet" ? `Bet $${amount}` : `Raise to $${amount}`
  }

  /* + goes to the next step above the amount, - to the next one below
     (a typed amount can sit between steps, e.g. 23 goes up to 25 or down to 20) */
  function stepBy(direction: 1 | -1) {
    const next = direction === 1
      ? steps.find(step => step > amount) ?? max
      : [...steps].reverse().find(step => step < amount) ?? min
    setChosen(next)
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
        {/* - amount + : the buttons step in $5, the box takes any whole amount */}
        <div className="flex items-center gap-1">
          <button
            aria-label="Decrease bet amount"
            disabled={busy || !range || amount <= min}
            onClick={() => stepBy(-1)}
            className={STEP_BUTTON}
          >
            −
          </button>
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
          <button
            aria-label="Increase bet amount"
            disabled={busy || !range || amount >= max}
            onClick={() => stepBy(1)}
            className={STEP_BUTTON}
          >
            +
          </button>
        </div>
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
