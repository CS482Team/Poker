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
    <span className="status-pill font-semibold">
      {balance === null ? "…" : `$${balance.toLocaleString()}`}
    </span>
  )
}