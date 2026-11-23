"use client"

import type { ShopItem } from "@shared/Cosmetics"

interface Props {
  item: ShopItem
  balance: number
  buying: boolean
  error: string | null
  onBuy: () => void
  onClose: () => void
}

export default function BuyModal({ item, balance, buying, error, onBuy, onClose }: Props) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && !buying && onClose()} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label={`Buy ${item.name}`} className="w-full max-w-[420px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">Buy {item.name}</h2>
          <button type="button" onClick={onClose} disabled={buying} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <p className="text-[#b5a9a9]">
            Your balance goes from {balance.toLocaleString()} to {(balance - item.cost).toLocaleString()} chips.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button type="button" onClick={onBuy} disabled={buying} className="secondary-action">
              {buying ? "Buying…" : `Buy for ${item.cost.toLocaleString()} chips`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
