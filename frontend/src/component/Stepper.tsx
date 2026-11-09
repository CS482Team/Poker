const labelClass = "grid gap-1.5 text-sm text-[#b5a9a9]"

export default function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className={labelClass}>
      {label}
      <div className="flex items-center rounded-lg border border-white/10 bg-black/40 pr-1.5 text-[#f5f2ef]">
        <span className="flex-1 px-3 py-2">{value}</span>
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-8 w-7 place-items-center rounded-md text-lg leading-none hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
          −
        </button>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-8 w-7 place-items-center rounded-md text-lg leading-none hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent">
          +
        </button>
      </div>
    </div>
  )
}
