"use client"

/* the signed in player's equipped items, kept up to date */
import { fetchLoadout, onLoadoutChange } from "@/service/ShopService"
import { getCurrentUserId } from "@/service/UserService"
import type { Loadout } from "@shared/Cosmetics"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/* your equipped items: reloaded on navigation, and updated straight away when an equip is announced */
export function useMyLoadout(): Loadout {
  const pathname = usePathname()
  const [loadout, setLoadout] = useState<Loadout>({})

  useEffect(() => {
    // signed out: nothing equipped, and no request the server would refuse
    const load = getCurrentUserId() ? fetchLoadout() : Promise.resolve({})
    load.then(setLoadout).catch(() => setLoadout({}))
  }, [pathname])

  useEffect(() => onLoadoutChange(setLoadout), [])

  return loadout
}
