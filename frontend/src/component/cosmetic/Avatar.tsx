"use client"

/**
 * Avatar: the inside of a portrait circle (a picture, or the player's initial).
 * The parent element sets the size, shape and border, so the same Avatar works in
 * a small chat bubble, a seat at the table or a large preview.
 */
import { initialOf } from "@/util/Cosmetic"
import { useState } from "react"

interface Props {
  /** Used for the fallback initial. */
  username: string
  /** The avatar picture, e.g. "/cosmetic/avatar/sly-fox.svg". Empty means show the initial. */
  url?: string | null | undefined
}

/**
 * Shows the avatar picture, or the player's initial if there's no picture or it
 * fails to load (a broken image would otherwise show the browser's broken-image icon).
 */
export default function Avatar({ username, url }: Props) {
  // flips to true if the image fails, so we switch to the initial instead
  const [broken, setBroken] = useState(false)

  if (url && !broken) {
    // plain <img>: these are small local SVGs, next/image adds nothing here
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" onError={() => setBroken(true)} className="avatar-photo" />
  }
  return <span aria-hidden>{initialOf(username)}</span>
}
