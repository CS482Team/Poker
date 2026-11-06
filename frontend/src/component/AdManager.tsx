"use client"

import type { Ad } from "@shared/Ad"
import { createAd, deleteAd, fetchAds, setAdActive } from "@/service/AdminService"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdManager() {
  const router = useRouter()
  const [ads, setAds] = useState<Ad[] | null>(null)
  const [title, setTitle] = useState("")
  const [rewardAmount, setRewardAmount] = useState(500)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAds()
      .then(setAds)
      .catch(() => router.replace("/dashboard"))
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createAd({ title, rewardAmount })
      setAds(await fetchAds())
      setTitle("")
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function toggle(ad: Ad) {
    try {
      await setAdActive(ad.id, !ad.active)
      setAds(await fetchAds())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(ad: Ad) {
    try {
      await deleteAd(ad.id)
      setAds(await fetchAds())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!ads) return null

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
      </div>

      <section className="panel padded">
        <div className="panel-head">
          <h2>Ads</h2>
        </div>

        <form onSubmit={submit} className="ad-form">
          <label className="crud-field">
            <span>Title</span>
            <input required value={title} placeholder="Weekend chip bonus" onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="crud-field">
            <span>Reward (chips)</span>
            <input type="number" min={0} required value={rewardAmount} onChange={(e) => setRewardAmount(Number(e.target.value))} />
          </label>
          <button type="submit" className="secondary-action">
            Save
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-3 border-t border-white/10">
          {ads.map((ad) => (
            <div key={ad.id} className="ad-row">
              <strong>{ad.title}</strong>
              <span className="text-sm text-[#b5a9a9]">${ad.rewardAmount}</span>
              <span className={`text-sm ${ad.active ? "text-[#6fd099]" : "text-[#b5a9a9]"}`}>{ad.active ? "Active" : "Inactive"}</span>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => toggle(ad)}>
                  {ad.active ? "Pause" : "Activate"}
                </button>
                <button type="button" onClick={() => remove(ad)} className="bad">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
