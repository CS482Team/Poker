const BUTTON =
  "rounded-md border border-black/40 bg-gradient-to-b from-neutral-700 to-neutral-900 px-6 py-3 text-lg font-semibold shadow-lg disabled:cursor-not-allowed"

// Placeholder for S2 (betting): everything is disabled until actions are wired up
export default function ActionBar({status}: {status: string}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button disabled className={`${BUTTON} text-fold`}>Fold</button>
        <button disabled className={BUTTON}>Call</button>
        <input type="range" disabled aria-label="Raise amount" className="w-28 accent-neutral-400" />
        <button disabled className={`${BUTTON} text-raise`}>Raise</button>
      </div>
      <p className="text-sm text-white/60">{status}</p>
    </div>
  )
}
