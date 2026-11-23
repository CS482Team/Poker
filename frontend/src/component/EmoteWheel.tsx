"use client"

/* the button at the table that opens your four equipped emotes */
import type { EmoteReply, EmoteSlot, ShopItem } from "@shared/Cosmetics"
import { EMOTE_COOLDOWN_SECONDS } from "@shared/Rules"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Props {
  /** emote_1 to emote_4 in order; undefined for an empty slot */
  wheel: (ShopItem | undefined)[]
  /** resolves with the server's reply */
  onSend: (slot: EmoteSlot) => Promise<EmoteReply>
}

/* the cooldown here only shows what the server already enforces */
export default function EmoteWheel({ wheel, onSend }: Props) {
  const [open, setOpen] = useState(false)
  const [coolingDown, setCoolingDown] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!coolingDown) return
    const timer = setTimeout(() => setCoolingDown(false), EMOTE_COOLDOWN_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [coolingDown])

  async function send(slot: EmoteSlot) {
    const reply = await onSend(slot)
    if (reply.ok) {
      setError(null)
      setOpen(false)
      setCoolingDown(true)
    } else {
      setError(reply.error)
    }
  }

  const empty = wheel.every((emote) => !emote)

  return (
    <div className="relative">
      <button type="button" aria-label="Emotes" aria-expanded={open} className="emote-button" disabled={coolingDown} onClick={() => setOpen(!open)}>
        <span aria-hidden>😄</span>
      </button>

      {open && (
        <div className="emote-wheel panel">
          {empty ? (
            <p className="text-sm">
              No emotes in your wheel yet.{" "}
              <Link href="/shop/my-items" className="underline">
                Equip emotes
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {wheel.map((emote, i) => {
                const slot = `emote_${i + 1}` as EmoteSlot
                return emote ? (
                  <button key={slot} type="button" className="emote-slot filled" aria-label={`Send ${emote.name}`} title={emote.name} onClick={() => send(slot)}>
                    {emote.style.text}
                  </button>
                ) : (
                  <button key={slot} type="button" className="emote-slot" aria-label="Empty slot" disabled>
                    Empty
                  </button>
                )
              })}
            </div>
          )}
          {error && (
            <p role="status" className="mt-2 text-sm text-[#ff8a8a]">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
