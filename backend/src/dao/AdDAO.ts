import type { Ad, NewAd } from "../../../shared/Ad"

import { getSupabase } from "../config/Supabase"

const AD_COLUMNS = "id, title, reward_amount, active"

export async function getAllAds(): Promise<Ad[]> {
  const { data, error } = await getSupabase().from("advert").select(AD_COLUMNS).order("created_at", { ascending: false })

  if (error) throw error

  return data.map(toAd)
}

export async function getActiveAds(): Promise<Ad[]> {
  const { data, error } = await getSupabase().from("advert").select(AD_COLUMNS).eq("active", true)

  if (error) throw error

  return data.map(toAd)
}

export async function getAd(id: string): Promise<Ad | null> {
  const { data, error } = await getSupabase().from("advert").select(AD_COLUMNS).eq("id", id).maybeSingle()

  if (error) throw error

  return data ? toAd(data) : null
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

export async function editAd(id: string, input: NewAd): Promise<void> {
  const { error } = await getSupabase()
    .from("advert")
    .update({ title: input.title, reward_amount: input.rewardAmount })
    .eq("id", id)

  if (error) throw error
}

export async function setAdActive(id: string, active: boolean): Promise<void> {
  const { error } = await getSupabase().from("advert").update({ active }).eq("id", id)

  if (error) throw error
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await getSupabase().from("advert").delete().eq("id", id)

  if (error) throw error
}

function toAd(row: { id: string; title: string; reward_amount: number; active: boolean }): Ad {
  return {
    id: row.id,
    title: row.title,
    rewardAmount: row.reward_amount,
    active: row.active,
  }
}
