"use client"

/* the speaker button in the navbar: music and effects volumes, plus mute */
import { useSoundSettings } from "@/hook/useSoundSettings"
import { playEffect, setSoundSettings } from "@/service/SoundService"
import { useEffect, useRef, useState } from "react"

export default function VolumeControl() {
  const { music, effects, muted } = useSoundSettings()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const silent = muted || (music === 0 && effects === 0)

  useEffect(() => {
    if (!open) return
    function closeOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", closeOutside)
    return () => document.removeEventListener("mousedown", closeOutside)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button type="button" aria-label={silent ? "Sound settings (muted)" : "Sound settings"} aria-expanded={open} onClick={() => setOpen(!open)} className="sound-button">
        <SpeakerIcon silent={silent} loud={Math.max(music, effects) > 0.5} />
      </button>

      {open && (
        <div className="sound-menu">
          <div className="mb-3 flex items-center justify-between">
            <p className="sound-menu-title">Sound</p>
            <button type="button" aria-label={muted ? "Unmute" : "Mute all sound"} title={muted ? "Unmute" : "Mute all sound"} onClick={() => setSoundSettings({ muted: !muted })} className="sound-mute">
              <SpeakerIcon silent={muted} loud />
            </button>
          </div>
          <VolumeSlider label="Music" value={music} disabled={muted} onChange={(value) => setSoundSettings({ music: value })} />
          {/* a sample on release, so you can hear the level you picked */}
          <VolumeSlider label="Effects" value={effects} disabled={muted} onChange={(value) => setSoundSettings({ effects: value })} onRelease={() => playEffect("chips")} />
        </div>
      )}
    </div>
  )
}

interface SliderProps {
  label: string
  /** from 0 to 1 */
  value: number
  disabled: boolean
  onChange: (value: number) => void
  onRelease?: () => void
}

function VolumeSlider({ label, value, disabled, onChange, onRelease }: SliderProps) {
  const percent = Math.round(value * 100)
  return (
    <label className="sound-slider">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-ink-muted">{percent}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        disabled={disabled}
        aria-label={`${label} volume`}
        style={{ "--fill": `${percent}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onRelease}
        onKeyUp={onRelease}
      />
    </label>
  )
}

function SpeakerIcon({ silent, loud }: { silent: boolean; loud: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" />
      {silent ? (
        <path d="m22 9-6 6M16 9l6 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          {loud && <path d="M19 5a10 10 0 0 1 0 14" />}
        </>
      )}
    </svg>
  )
}
