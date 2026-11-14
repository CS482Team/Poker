"use client"

import type { Ad } from "@shared/Ad"
import ImagePicker from "@/component/ImagePicker"
import { editAd } from "@/service/AdminService"
import { useState } from "react"

export default function AdImageModal({ ad, onCancel, onSaved }: { ad: Ad; onCancel: () => void; onSaved: () => void }) {
  const [imageUrl, setImageUrl] = useState(ad.imageUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    try {
      await editAd(ad.id, { title: ad.title, rewardAmount: ad.rewardAmount, imageUrl })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-[560px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">{ad.title}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <ImagePicker imageUrl={imageUrl} onChange={setImageUrl} className="aspect-video w-full">
            Choose image
          </ImagePicker>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="secondary-action small danger">
                Remove
              </button>
            )}
            <button type="button" onClick={onCancel} className="secondary-action small ml-auto">
              Cancel
            </button>
            <button type="button" onClick={save} className="primary-action small">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
