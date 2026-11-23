"use client"

/* the player's sound settings, kept in sync with SoundService */
import { DEFAULT_SOUND_SETTINGS, getSoundSettings, onSoundSettingsChange, type SoundSettings } from "@/service/SoundService"
import { useSyncExternalStore } from "react"

export function useSoundSettings(): SoundSettings {
  // the server render can't see browser storage, so it uses the defaults
  return useSyncExternalStore(onSoundSettingsChange, getSoundSettings, () => DEFAULT_SOUND_SETTINGS)
}
