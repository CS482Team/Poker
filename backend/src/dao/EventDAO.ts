import type { PromoEvent } from "../../../shared/Event"
import { getSupabase } from "../config/Supabase"

export async function getActiveEvent(): Promise<PromoEvent | null> {
  const { data, error } = await getSupabase()
    .from("event")
    .select("id, name, multiplier, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data ? { id: data.id, name: data.name, multiplier: Number(data.multiplier), expiresAt: data.expires_at } : null
}

export async function createEvent(name: string, multiplier: number, days: number, createdBy: string): Promise<void> {
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await getSupabase().from("event").insert({ name, multiplier, expires_at: expiresAt, created_by: createdBy })

  if (error) throw error
}

export async function endEvent(id: string): Promise<void> {
  const { error } = await getSupabase().from("event").update({ expires_at: new Date().toISOString() }).eq("id", id)

  if (error) throw error
}
