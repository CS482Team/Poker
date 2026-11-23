"use client"

import { useEffect, useState } from "react"
import { fetchMyProfile } from "@/service/UserService"
import type { MyProfile } from "@shared/User"
import { changeUsername } from "@/service/UserService"
import ProfileForm from "./ProfileForm"

export default function ProfileCard() {
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(
    () => { 
      fetchMyProfile().then(setProfile) 
    }, [])

  // async function saveUsername(username: string) {
  //   try {
  //     await changeUsername(username)
  //     setProfile({ ...profile!, username: username.trim() })
  //     setEditing(null)
  //   } catch (err) {
  //     setError((err as Error).message)
  //   }
  // }

  function onCancel() {

  }

  return (
    <>
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>
      <section className="panel p-5">
        <p>{profile?.email}</p>
        <p>{profile?.username}</p>
        <img src={profile?.avatarUrl}></img>

        <button type="button" onClick={() => setFormOpen(true)}>
          Edit Profile
        </button>
      </section>
    </div>

    {formOpen && <ProfileForm profile={profile} onCancel={() => setFormOpen(false)}/>}
    </>
  )
}