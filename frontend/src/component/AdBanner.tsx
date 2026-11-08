"use client"

import { fetchActiveAds } from "@/service/AdService"
import { useEffect, useState } from "react"

export const EXTERNAL_AD = "THIS IS AN EXTERNAL AD"

export default function AdBanner() {
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveAds()
      .then((ads) => [EXTERNAL_AD, ...ads.map((ad) => ad.title)])
      .catch(() => [EXTERNAL_AD])
      .then((titles) => setTitle(titles[Math.floor(Math.random() * titles.length)]))
  }, [])

  if (!title) return null

  return (
    <div className="ad-banner">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d6d6d]">Advertisement</p>
      <p className="text-sm font-semibold tracking-[.12em] text-white">{title}</p>
    </div>
  )
}
