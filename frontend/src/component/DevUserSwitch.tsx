"use client"

import { DEV_USERS, getCurrentUserId, setCurrentUserId } from "@/service/userService"
import { useEffect, useState } from "react"

/* TODO dev only, delete once auth exists */
export default function DevUserSwitch() {
  const [userId, setUserId] = useState(DEV_USERS[0].id)

  useEffect(() => setUserId(getCurrentUserId()), [])

  function change(id: string) {
    setCurrentUserId(id)
    window.location.reload()
  }

  return (
    <select value={userId} onChange={(e) => change(e.target.value)} aria-label="Dev user" className="absolute right-4 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-[#f5f2ef]">
      {DEV_USERS.map((user) => (
        <option key={user.id} value={user.id} className="bg-[#181414]">
          {user.name}
        </option>
      ))}
    </select>
  )
}
