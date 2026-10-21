// Dev switcher from the mock; Draw and Showdown unlock with S3 / S4
const DEV_TABS = [
  { label: "Table", enabled: true },
  { label: "Draw", enabled: false },
  { label: "Showdown", enabled: false },
]

interface RoomHeaderProps {
  stakes: string
  dealing: boolean
  revealAll: boolean
  onDeal: () => void
  onToggleReveal: () => void
}

export default function RoomHeader({ stakes, dealing, revealAll, onDeal, onToggleReveal }: RoomHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-4xl font-bold">Room 1</h1>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-white/60">Dev</span>
        <div className="flex gap-1">
          {DEV_TABS.map(tab => (
            <button
              key={tab.label}
              disabled={!tab.enabled}
              className={`rounded border border-black/40 px-3 py-1.5 shadow ${
                tab.enabled ? "bg-neutral-600" : "bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={revealAll} onChange={onToggleReveal} className="accent-red-600" />
          Reveal all
        </label>
        <button
          onClick={onDeal}
          disabled={dealing}
          className="rounded bg-raise px-4 py-1.5 font-semibold text-black shadow disabled:opacity-50"
        >
          {dealing ? "Dealing..." : "Deal"}
        </button>
        <span className="flex items-center gap-1.5 text-white/80">
          <span className="size-1.5 rounded-full bg-red-400" />
          {stakes}
        </span>
      </div>
    </header>
  )
}
