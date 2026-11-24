"use client"

import { useState } from "react"

/* A player's profile picture, or their initials if they have none or it fails to load */
export default function Avatar({ name, url, className = "size-7" }: { name: string | null; url: string | null; className?: string }) {
  const [broken, setBroken] = useState(false)
  const shape = `${className} shrink-0 rounded-full border border-panel-edge`
  if (url && !broken) {
    // plain <img>: avatars can come from any host, which next/image would need configuring for
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" onError={() => setBroken(true)} className={`${shape} object-cover`} />
  }
  return (
    <span aria-hidden className={`${shape} flex items-center justify-center bg-panel-raised text-xs font-semibold`}>
      {initials(name)}
    </span>
  )
}

/* "Maya" → "M", "Johnny Christmas" → "JC" */
export function initials(name: string | null) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")
}
