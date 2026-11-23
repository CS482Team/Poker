"use client"

/* body of /shop: your balance, a tab per category and the item grid */
import ShopItemCard from "@/component/ShopItemCard"
import { announceBalance, fetchBalance } from "@/service/BalanceService"
import { buyItem, fetchShopItems } from "@/service/ShopService"
import { playEffect } from "@/service/SoundService"
import { fetchUsername, getCurrentUserId } from "@/service/UserService"
import { COSMETIC_LABELS } from "@/util/Cosmetic"
import { COSMETIC_TYPES, type CosmeticType, type ShopItem } from "@shared/Cosmetics"
import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"

// the session never changes while the shop is open, so there's nothing to subscribe to
const noSubscribe = () => () => {}

export default function Shop() {
  // null on the server render (no browser storage there), "" for a guest
  const userId = useSyncExternalStore(noSubscribe, getCurrentUserId, () => null)
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState("You")
  const [balance, setBalance] = useState<number | null>(null)
  const [tab, setTab] = useState<CosmeticType | null>(null)

  useEffect(() => {
    fetchShopItems()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchBalance().then(setBalance).catch(console.error)
    fetchUsername(userId).then(setUsername).catch(console.error)
  }, [userId])

  async function handleBuy(item: ShopItem) {
    const newBalance = await buyItem(item.id)
    setBalance(newBalance)
    setItems((current) => current?.map((i) => (i.id === item.id ? { ...i, owned: true } : i)) ?? null)
    announceBalance(newBalance)
    playEffect("purchase")
  }

  const signedIn = userId !== ""
  const categories = COSMETIC_TYPES.filter((type) => items?.some((item) => item.type === type))
  const active = tab ?? categories[0]
  const shown = items?.filter((item) => item.type === active) ?? []
  const ownedCount = shown.filter((item) => item.owned).length

  return (
    <div className="page-shell">
      <ShopHeader balance={balance} signedIn={signedIn} />

      {error && (
        <p role="alert" className="shop-error panel p-4">
          {error}
        </p>
      )}
      {!items && !error && <p className="py-10 text-center text-lg text-[#9e9393]">Loading the shop…</p>}
      {items && categories.length === 0 && <p className="py-10 text-center text-lg text-[#9e9393]">Nothing for sale right now. Check back soon.</p>}

      {active && (
        <>
          <div className="panel shop-tabbar">
            <div role="tablist" aria-label="Categories" className="shop-tabs">
              {categories.map((type) => (
                <button key={type} type="button" role="tab" id={`tab-${type}`} aria-controls="shop-panel" aria-selected={type === active} className={type === active ? "shop-tab active" : "shop-tab"} onClick={() => setTab(type)}>
                  {COSMETIC_LABELS[type]}
                </button>
              ))}
            </div>
            {signedIn && (
              <p className="shrink-0 pr-5 text-sm text-[#9e9393]">
                {ownedCount} of {shown.length} owned
              </p>
            )}
          </div>

          <section role="tabpanel" id="shop-panel" aria-labelledby={`tab-${active}`}>
            <div className="grid gap-4 lg:grid-cols-2">
              {shown.map((item) => (
                <ShopItemCard key={item.id} item={item} username={username} balance={balance} signedIn={signedIn} onBuy={handleBuy} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ShopHeader({ balance, signedIn }: { balance: number | null; signedIn: boolean }) {
  return (
    <div className="page-header">
      <h1 className="page-title">
        Shop {signedIn && <small aria-label="Available balance">{balance === null ? "…" : balance.toLocaleString()} chips</small>}
      </h1>
      {signedIn ? (
        <Link href="/shop/my-items" className="secondary-action">
          My Items
        </Link>
      ) : (
        <Link href="/" className="secondary-action">
          Sign in to start collecting
        </Link>
      )}
    </div>
  )
}
