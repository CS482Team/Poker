"use client"

/* body of /shop/my-items: loads your items and saves each equip */
import MyItems from "@/component/MyItems"
import { announceLoadout, equipItem, fetchInventory, fetchLoadout, unequipSlot } from "@/service/ShopService"
import { fetchUsername, getCurrentUserId } from "@/service/UserService"
import type { Loadout, LoadoutSlot, ShopItem } from "@shared/Cosmetics"
import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"

// the session never changes while the page is open, so there's nothing to subscribe to
const noSubscribe = () => () => {}

/* each equip shows the loadout the server sends back, so the page matches what's saved (e.g. a moved emote) */
export default function MyItemsPage() {
  // null on the server render (no browser storage there), "" for a guest
  const userId = useSyncExternalStore(noSubscribe, getCurrentUserId, () => null)
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [loadout, setLoadout] = useState<Loadout>({})
  const [username, setUsername] = useState("You")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    Promise.all([fetchInventory(), fetchLoadout()])
      .then(([owned, equipped]) => {
        setItems(owned)
        setLoadout(equipped)
      })
      .catch((e: Error) => setError(e.message))
    fetchUsername(userId).then(setUsername).catch(console.error)
  }, [userId])

  function show(saved: Loadout) {
    setLoadout(saved)
    announceLoadout(saved)
  }

  async function handleEquip(item: ShopItem, slot: LoadoutSlot) {
    setError(null)
    try {
      show(await equipItem(slot, item.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update your loadout")
    }
  }

  async function handleUnequip(slot: LoadoutSlot) {
    setError(null)
    try {
      show(await unequipSlot(slot))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update your loadout")
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">My Items</h1>
        <Link href="/shop" className="secondary-action">
          Shop
        </Link>
      </div>

      {error && (
        <p role="alert" className="shop-error panel mb-4 p-4">
          {error}
        </p>
      )}

      {userId === "" ? (
        <section className="panel p-8 text-center text-lg">
          <p>Sign in to see and equip your cosmetics.</p>
          <Link href="/" className="primary-action buy-action mt-5">
            Sign in
          </Link>
        </section>
      ) : items === null ? (
        !error && <p className="py-10 text-center text-lg text-[#9e9393]">Loading your items…</p>
      ) : (
        <MyItems username={username} items={items} loadout={loadout} onEquip={handleEquip} onUnequip={handleUnequip} />
      )}
    </div>
  )
}
