/* plays the game's sound effects and music, at the volumes the player picked (saved in this browser) */

export type SoundEffect = "deal" | "check" | "chips" | "fold" | "win" | "turn" | "emote" | "purchase"

/** volumes from 0 to 1 */
export interface SoundSettings {
  music: number
  effects: number
  muted: boolean
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = { music: 0.2, effects: 0.8, muted: false }

// files live in frontend/public/sound/; `level` evens out how loud each recording is
const EFFECTS: Record<SoundEffect, { src: string; level: number }> = {
  deal: { src: "/sound/deal.ogg", level: 0.7 },
  check: { src: "/sound/check.ogg", level: 0.6 },
  chips: { src: "/sound/chips.ogg", level: 0.8 },
  fold: { src: "/sound/fold.ogg", level: 0.6 },
  win: { src: "/sound/win.ogg", level: 0.9 },
  turn: { src: "/sound/turn.ogg", level: 0.7 },
  emote: { src: "/sound/emote.ogg", level: 0.6 },
  purchase: { src: "/sound/purchase.ogg", level: 0.8 },
}
const MUSIC_SRC = "/sound/music.ogg"
const STORAGE_KEY = "hd-sound"

let settings: SoundSettings = loadSettings()
const listeners = new Set<() => void>()
let music: HTMLAudioElement | null = null // created on first startMusic, after the player has clicked something

export function getSoundSettings(): SoundSettings {
  return settings
}

/** changes some settings, saves them and applies them straight away (including to music that's playing) */
export function setSoundSettings(change: Partial<SoundSettings>): void {
  settings = {
    music: clamp(change.music ?? settings.music),
    effects: clamp(change.effects ?? settings.effects),
    muted: change.muted ?? settings.muted,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // storage can be blocked (private windows); the settings still apply for this visit
  }
  applyMusic()
  listeners.forEach((listener) => listener())
}

/** returns a function that stops listening */
export function onSoundSettingsChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function playEffect(name: SoundEffect): void {
  if (settings.muted || settings.effects === 0) return
  const { src, level } = EFFECTS[name]
  const audio = new Audio(src) // a new element each time, so quick repeats can overlap
  audio.volume = settings.effects * level
  quietly(audio.play())
}

/* browsers block sound until the player interacts with the page, so call this from a click or key press */
export function startMusic(): void {
  if (!music) {
    music = new Audio(MUSIC_SRC)
    music.loop = true
  }
  applyMusic()
}

function applyMusic() {
  if (!music) return
  music.volume = settings.music
  if (settings.muted || settings.music === 0) music.pause()
  else quietly(music.play())
}

// a missing file or a blocked play() just means silence, never an error
function quietly(playing: Promise<void> | undefined) {
  playing?.catch(() => {})
}

function clamp(volume: number) {
  return Math.min(1, Math.max(0, volume))
}

function loadSettings(): SoundSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    return saved ? { ...DEFAULT_SOUND_SETTINGS, ...saved } : DEFAULT_SOUND_SETTINGS
  } catch {
    return DEFAULT_SOUND_SETTINGS // unreadable, or no storage (e.g. the server render)
  }
}
