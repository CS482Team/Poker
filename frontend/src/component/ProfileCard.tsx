"use client"


/* your profile at the top of the profile page: picture, name and email, with an Edit button */
import Avatar from "@/component/cosmetic/Avatar"
import ProfileForm from "@/component/ProfileForm"
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
    <section aria-label="Your profile" className="panel mb-6 flex flex-wrap items-center gap-5 p-5">
        <div className="cosmetic-portrait large">
          <Avatar username={profile.username} url={profile.avatarUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-bold">{profile.username}</h2>
          <p className="text-[#b8aeae]">{profile.isGuest ? "Guest account" : profile.email}</p>
        </div>
        <button type="button" className="secondary-action" onClick={() => setEditing(true)}>
          Edit profile
        </button>
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