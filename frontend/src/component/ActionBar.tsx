import type { ActionType, LegalAction } from "@/service/Game"

const BUTTON =
  "rounded-md border border-black/40 bg-gradient-to-b from-neutral-700 to-neutral-900 px-6 py-3 text-lg font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-50"

interface ActionBarProps {
  legalActions: LegalAction[] // empty when it isn't the viewer's turn
  busy: boolean
  status: string
  onAction: (type: ActionType) => void
}

// Fold / Check-or-Call / Bet-or-Raise, built from what the backend says is legal (S2).
// Fixed-limit: amounts come from the backend, so the slider stays disabled.
export default function ActionBar({ legalActions, busy, status, onAction }: ActionBarProps) {
  const find = (type: ActionType) => legalActions.find(a => a.type === type)
  const fold = find("fold")
  const passive = find("check") ?? find("call")
  const aggressive = find("bet") ?? find("raise")

  const label = (a: LegalAction | undefined, fallback: string) =>
    !a ? fallback : a.amount > 0 ? `${capitalize(a.type)} ${a.amount}` : capitalize(a.type)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button disabled={busy || !fold} onClick={() => onAction("fold")} className={`${BUTTON} text-fold`}>
          Fold
        </button>
        <button disabled={busy || !passive} onClick={() => passive && onAction(passive.type)} className={BUTTON}>
          {label(passive, "Call")}
        </button>
        <input type="range" disabled aria-label="Raise amount" className="w-28 accent-neutral-400" />
        <button
          disabled={busy || !aggressive}
          onClick={() => aggressive && onAction(aggressive.type)}
          className={`${BUTTON} text-raise`}
        >
          {label(aggressive, "Raise")}
        </button>
      </div>
      <p className="text-sm text-white/60">{status}</p>
    </div>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
