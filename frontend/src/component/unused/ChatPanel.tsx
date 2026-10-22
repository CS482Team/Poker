// Sample messages so the panel looks like the mock; real chat comes with S15
const SAMPLE_MESSAGES = [
  { name: "Bob", time: "10:24", body: "Good luck all" },
  { name: "Cara", time: "10:25", body: "Deal me in" },
  { name: "Dan", time: "10:26", body: "Let's go" },
]

export default function ChatPanel() {
  return (
    <aside className="flex h-[480px] w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-panel-edge bg-panel shadow-2xl">
      <header className="flex items-center justify-between bg-gradient-to-b from-neutral-800 to-panel px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Chat <span className="size-2 rounded-full bg-green-400" />
        </h2>
        <button disabled className="rounded border border-white/10 bg-neutral-800 px-3 py-1 text-sm disabled:opacity-70">
          Contact admin
        </button>
      </header>
      <ul className="flex-1 space-y-4 p-4">
        {SAMPLE_MESSAGES.map(m => (
          <li key={m.time} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-neutral-700 text-sm">
              {m.name[0]}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {m.name} <span className="ml-1 text-xs font-normal text-white/50">{m.time}</span>
              </p>
              <p className="font-sans text-sm">{m.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <footer className="flex gap-2 border-t border-panel-edge p-3">
        <input
          disabled
          placeholder="Message the table"
          className="min-w-0 flex-1 rounded border border-white/10 bg-black/30 px-3 py-2 text-sm placeholder:text-white/40"
        />
        <button disabled className="rounded bg-neutral-700 px-4 text-sm font-semibold disabled:opacity-70">
          Send
        </button>
      </footer>
    </aside>
  )
}
