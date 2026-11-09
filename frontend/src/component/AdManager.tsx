"use client"

import type { Ad } from "@shared/Ad"
import Icon, { CHECK, CROSS, PENCIL, PLUS, TRASH } from "@/component/Icon"
import NewAdForm from "@/component/NewAdForm"
import { deleteAd, editAd, fetchAds, setAdActive } from "@/service/AdminService"
import { useEffect, useState } from "react"

const ROW = "grid grid-cols-[minmax(0,1fr)_72px_auto_76px] items-center gap-3 px-1 sm:grid-cols-[minmax(0,1fr)_120px_140px_96px] sm:gap-4"
const ICON = "grid size-8 place-items-center rounded-md text-[#9e9393] transition-colors hover:bg-white/10 hover:text-white"
const INPUT = "w-full rounded-md border border-white/15 bg-black/50 px-2.5 py-1.5 text-[15px] text-[#f5f2ef] outline-none focus:border-white/40 [color-scheme:dark]"

export default function AdManager() {
  const [ads, setAds] = useState<Ad[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [rewardAmount, setRewardAmount] = useState(0)

  useEffect(() => {
    fetchAds()
      .then(setAds)
      .catch((err: Error) => {
        setAds([])
        setError(err.message)
      })
  }, [])

  async function run(action: () => Promise<void>) {
    try {
      await action()
      setAds(await fetchAds())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function startEdit(ad: Ad) {
    setDeletingId(null)
    setEditingId(ad.id)
    setTitle(ad.title)
    setRewardAmount(ad.rewardAmount)
  }

  function saveEdit(ad: Ad) {
    return run(async () => {
      await editAd(ad.id, { title, rewardAmount })
      setEditingId(null)
    })
  }

  function onKey(e: React.KeyboardEvent, ad: Ad) {
    if (e.key === "Enter") saveEdit(ad)
    if (e.key === "Escape") setEditingId(null)
  }

  if (!ads) return null

  return (
    <>
      {creating && <NewAdForm onCancel={() => setCreating(false)} onCreated={() => run(async () => setCreating(false))} />}

      <section className="panel padded">
        <div className="panel-head">
          <h2>Ads</h2>
          <button type="button" onClick={() => setCreating(true)} className="primary-action small gap-1.5">
            <Icon d={PLUS} size={16} />
            New Ad
          </button>
        </div>

        {error && <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {ads.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#9e9393]">No ads yet.</p>
        ) : (
          <>
            <div className={`${ROW} border-b border-white/10 pb-2 text-[13px] text-[#9e9393]`}>
              <span>Title</span>
              <span>Reward</span>
              <span>Status</span>
              <span />
            </div>

            {ads.map((ad) => {
              const editing = ad.id === editingId
              const deleting = ad.id === deletingId
              return (
                <div key={ad.id} className={`${ROW} min-h-14 rounded-md border-b border-white/5 last:border-0 ${editing ? "bg-white/[.04]" : "hover:bg-white/[.02]"}`}>
                  {editing ? (
                    <input aria-label="Title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => onKey(e, ad)} className={INPUT} />
                  ) : (
                    <span className="truncate text-[15px] font-medium">{ad.title}</span>
                  )}

                  {editing ? (
                    <input aria-label="Reward" type="number" min={0} value={rewardAmount} onChange={(e) => setRewardAmount(Number(e.target.value))} onKeyDown={(e) => onKey(e, ad)} className={`${INPUT} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`} />
                  ) : (
                    <span className="text-sm tabular-nums text-[#d8cfcf]">${ad.rewardAmount}</span>
                  )}

                  <button type="button" role="switch" aria-checked={ad.active} aria-label={`${ad.title} active`} onClick={() => run(() => setAdActive(ad.id, !ad.active))} className="flex items-center gap-2.5 text-sm">
                    <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${ad.active ? "bg-[#3f9e68]" : "bg-white/15"}`}>
                      <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${ad.active ? "translate-x-4" : ""}`} />
                    </span>
                    <span className={`hidden sm:inline ${ad.active ? "text-[#6fd099]" : "text-[#9e9393]"}`}>{ad.active ? "Active" : "Inactive"}</span>
                  </button>

                  <div className="flex items-center justify-end gap-1">
                    {editing && (
                      <>
                        <button type="button" aria-label="Save" onClick={() => saveEdit(ad)} className={`${ICON} text-[#6fd099]`}>
                          <Icon d={CHECK} />
                        </button>
                        <button type="button" aria-label="Cancel" onClick={() => setEditingId(null)} className={ICON}>
                          <Icon d={CROSS} />
                        </button>
                      </>
                    )}
                    {deleting && (
                      <>
                        <button type="button" onClick={() => run(() => deleteAd(ad.id))} className="h-8 rounded-md bg-red-500/15 px-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/25">
                          Delete
                        </button>
                        <button type="button" aria-label="Keep ad" onClick={() => setDeletingId(null)} className={ICON}>
                          <Icon d={CROSS} />
                        </button>
                      </>
                    )}
                    {!editing && !deleting && (
                      <>
                        <button type="button" aria-label="Edit ad" onClick={() => startEdit(ad)} className={ICON}>
                          <Icon d={PENCIL} />
                        </button>
                        <button type="button" aria-label="Delete ad" onClick={() => setDeletingId(ad.id)} className={`${ICON} hover:text-red-300`}>
                          <Icon d={TRASH} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </section>
    </>
  )
}
