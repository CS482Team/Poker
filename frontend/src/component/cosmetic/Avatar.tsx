"use client"

/* the inside of a portrait: the player's picture or initial */
import { initialOf } from "@/util/Cosmetic"
import { useState } from "react"

interface Props {
  username: string
  /** empty, or an image that fails to load, shows the initial */
  url?: string | null | undefined
}

/* fills its parent, which sets the size and border; shows the initial if there's no picture or it fails to load */
export default function Avatar({ username, url }: Props) {
  const [broken, setBroken] = useState(false)

  if (url && !broken) {
    // plain <img>: these are small local SVGs, next/image adds nothing here
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" onError={() => setBroken(true)} className="avatar-photo" />
  }
  return <span aria-hidden>{initialOf(username)}</span>
}
