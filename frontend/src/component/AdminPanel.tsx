"use client"

import AdManager from "@/component/AdManager"
import PlayerHistory from "@/component/PlayerHistory"
import { isAdmin } from "@/service/AdminService"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminPanel() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    isAdmin()
      .catch(() => false)
      .then((ok) => (ok ? setAllowed(true) : router.replace("/dashboard")))
  }, [router])

  if (!allowed) return null

  return (
    <div className="page-shell flex flex-col gap-6">
      <h1 className="page-title">Admin</h1>
      <PlayerHistory />
      <AdManager />
    </div>
  )
}
