import type { Ad, NewAd } from "../../../shared/Ad"

import { getSupabase } from "../config/Supabase"

export async function getAllAds(): Promise<Ad[]> {
  const { data, error } = await getSupabase()
    .from("advert")
    .select("id, title, reward_amount, active")
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    rewardAmount: row.reward_amount,
    active: row.active,
  }))
}

export async function createAd(input: NewAd, createdBy: string): Promise<string> {
  const { data, error } = await getSupabase()
    .from("advert")
    .insert({
      title: input.title,
      reward_amount: input.rewardAmount,
      active: false,
      created_by: createdBy,
    })
    .select("id")
    .single()

  if (error) throw error

  return data.id
}

export async function setAdActive(id: string, active: boolean): Promise<void> {
  const { error } = await getSupabase().from("advert").update({ active }).eq("id", id)

  if (error) throw error
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await getSupabase().from("advert").delete().eq("id", id)

  if (error) throw error
}
