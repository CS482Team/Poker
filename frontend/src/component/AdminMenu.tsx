"use client"

import { isAdmin } from "@/service/AdminService"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function AdminMenu() {
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    isAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  if (!admin) return null

  return (
    <div className="relative">
      <button type="button" aria-label="Account menu" onClick={() => setOpen(!open)} className="avatar-initial">
        A
      </button>
      {open && (
        <div className="profile-menu">
          <Link href="/admin" onClick={() => setOpen(false)}>
            Admin
          </Link>
        </div>
      )}
    </div>
  )
}
