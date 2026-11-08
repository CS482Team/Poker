"use client"

import type { Ad } from "@shared/Ad"
import AdWatchModal from "@/component/AdWatchModal"
import { fetchActiveAds } from "@/service/AdService"
import { useEffect, useState } from "react"

export default function AdBanner() {
  const [ad, setAd] = useState<Ad | null>(null)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    fetchActiveAds()
      .then((ads) => setAd(ads[Math.floor(Math.random() * ads.length)] ?? null))
      .catch(() => setAd(null))
  }, [])

  if (!ad) return null

  return (
    <>
      <button type="button" onClick={() => setWatching(true)} className="ad-banner cursor-pointer transition hover:brightness-125">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d6d6d]">Advertisement</p>
        <p className="text-sm font-semibold tracking-[.12em] text-white">{ad.title}</p>
      </button>
      {watching && <AdWatchModal ad={ad} onClose={() => setWatching(false)} />}
    </>
  )
}
