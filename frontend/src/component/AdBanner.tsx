"use client"

import type { Ad } from "@shared/Ad"
import type { PromoEvent } from "@shared/Event"
import AdWatchModal from "@/component/AdWatchModal"
import PromoModal from "@/component/PromoModal"
import { fetchActiveAds } from "@/service/AdService"
import { fetchActiveEvent } from "@/service/EventService"
import { useEffect, useState } from "react"

export default function AdBanner() {
  const [ad, setAd] = useState<Ad | null>(null)
  const [event, setEvent] = useState<PromoEvent | null>(null)
  const [watching, setWatching] = useState(false)
  const [showingEvent, setShowingEvent] = useState(false)

  useEffect(() => {
    fetchActiveAds()
      .then((ads) => setAd(ads[Math.floor(Math.random() * ads.length)] ?? null))
      .catch(() => setAd(null))
    fetchActiveEvent()
      .then(setEvent)
      .catch(() => setEvent(null))
  }, [])

  if (!ad && !event) return null

  return (
    <div className="banner-row">
      {event && (
        <button type="button" onClick={() => setShowingEvent(true)} className="ad-banner promo-banner cursor-pointer transition hover:brightness-125">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#bf8a52]">Special Event</p>
          <p className="text-sm font-semibold tracking-[.12em] text-white">
            {event.multiplier}X Chip Multiplier
          </p>
        </button>
      )}
      {showingEvent && event && <PromoModal event={event} onClose={() => setShowingEvent(false)} />}
      {ad && (
        <button type="button" onClick={() => setWatching(true)} className="ad-banner cursor-pointer transition hover:brightness-125">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d6d6d]">Advertisement</p>
          <p className="text-sm font-semibold tracking-[.12em] text-white">{ad.title}</p>
        </button>
      )}
      {watching && ad && <AdWatchModal ad={ad} onClose={() => setWatching(false)} />}
    </div>
  )
}
