"use client"

import { fetchBalance } from "@/service/BalanceService"
import { getCurrentUserId } from "@/service/UserService"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function BalanceDisplay() {
  const pathname = usePathname()
  const [balance, setBalance] = useState<number | null>(null)

  // refetch on navigation so joining or leaving a table updates the number
  useEffect(() => {
    fetchBalance(getCurrentUserId()).then(setBalance).catch(console.error)
  }, [pathname])

  return (
    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 py-1.5 pl-2 pr-4 text-base font-semibold text-white">
      <span className="chip" aria-hidden />
      {balance === null ? "…" : `$${balance.toLocaleString()}`}
    </span>
  )
}