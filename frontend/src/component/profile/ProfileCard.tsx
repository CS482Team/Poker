"use client"

import Avatar from "@/component/cosmetic/Avatar"
import Icon, { PENCIL } from "@/component/common/Icon"
import ProfileForm from "@/component/profile/ProfileForm"
import { fetchMyProfile } from "@/service/ProfileService"
import type { MyProfile } from "@shared/User"
import { useEffect, useState } from "react"

export default function ProfileCard() {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) {
    return (
      <p role="alert" className="mb-6 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {error}
      </p>
    )
  }

  if (!profile) return <p className="mb-6 text-[#9e9393]">Loading your profile…</p>

  return (
    <>
      <section aria-label="Your profile" className="mb-6 flex items-center gap-4">
        <div className="cosmetic-portrait">
          <Avatar username={profile.username} url={profile.avatarUrl} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="page-title truncate">{profile.username}</h1>
            <button type="button" aria-label="Edit profile" title="Edit profile" onClick={() => setEditing(true)} className="grid size-9 shrink-0 place-items-center rounded-md text-[#b5a9a9] transition-colors hover:bg-white/10 hover:text-white">
              <Icon d={PENCIL} size={18} />
            </button>
          </div>
          <p className="text-[#b8aeae]">{profile.isGuest ? "Guest account" : profile.email}</p>
        </div>
      </section>
      {editing && (
        <ProfileForm
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            setProfile(saved)
            setEditing(false)
          }}
        />
      )}
    </>
  )
}