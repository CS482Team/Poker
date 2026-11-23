"use client"

import type { Ad } from "@shared/Ad"
import type { PromoEvent } from "@shared/Event"
import AdWatchModal from "@/component/AdWatchModal"
import Icon, { WATCH } from "@/component/Icon"
import PromoModal from "@/component/PromoModal"
import { fetchActiveAds } from "@/service/AdService"
import { fetchActiveEvent } from "@/service/EventService"
import { useEffect, useState } from "react"

export default function AdBanner() {
  const [sideAds, setSideAds] = useState<Ad[]>([])
  const [event, setEvent] = useState<PromoEvent | null>(null)
  const [watching, setWatching] = useState<Ad | null>(null)
  const [showingEvent, setShowingEvent] = useState(false)

  useEffect(() => {
    fetchActiveAds()
      .then((ads) => {
        if (ads.length === 0) return
        const first = Math.floor(Math.random() * ads.length)
        setSideAds([ads[first]!, ads[(first + 1) % ads.length]!])
      })
      .catch(() => setSideAds([]))
    fetchActiveEvent()
      .then(setEvent)
      .catch(() => setEvent(null))
  }, [])

  return (
    <>
      {event && (
        <div className="banner-row">
          <button type="button" onClick={() => setShowingEvent(true)} className="ad-banner promo-banner cursor-pointer transition hover:brightness-105">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#4a4444]">{event.name}</p>
            <p className="text-lg font-bold tracking-[.1em] text-[#121010]">{event.multiplier}X Chip Multiplier</p>
          </button>
        </div>
      )}
      {showingEvent && event && <PromoModal event={event} onClose={() => setShowingEvent(false)} />}
      {sideAds.map((ad, i) => (
        <button key={i} type="button" onClick={() => setWatching(ad)} className={`ad-banner ad-rail ${i === 0 ? "left" : "right"} cursor-pointer transition`}>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60">Advertisement</p>
          {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-full rounded-md" />}
          <b className="text-base font-semibold leading-snug tracking-[.12em] text-white">{ad.title}</b>
          <p className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#cfcccc]">
            <Icon d={WATCH} size={16} />+{ad.rewardAmount} chips
          </p>
        </button>
      ))}
      {watching && <AdWatchModal ad={watching} onClose={() => setWatching(null)} />}
    </>
  )
}
