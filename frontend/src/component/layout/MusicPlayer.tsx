"use client"

/* starts the background music on the player's first click or key press (browsers block sound before that) */
import { startMusic } from "@/service/SoundService"
import { useEffect } from "react"

export default function MusicPlayer() {
  useEffect(() => {
    function start() {
      startMusic()
      stop()
    }
    function stop() {
      window.removeEventListener("pointerdown", start)
      window.removeEventListener("keydown", start)
    }
    window.addEventListener("pointerdown", start)
    window.addEventListener("keydown", start)
    return stop
  }, [])

  return null
}
