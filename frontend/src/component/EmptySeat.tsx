export default function EmptySeat() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-black/40 text-xs text-white/80">
        Open
      </div>
      <div className="mt-1 rounded bg-panel/90 px-3 py-1 text-sm text-white/80 shadow">Open seat</div>
    </div>
  )
}