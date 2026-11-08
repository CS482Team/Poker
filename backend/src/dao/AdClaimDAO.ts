import { getSupabase } from "../config/Supabase"

export async function createAdClaim(userId: string, adId: string): Promise<void> {
  const { error } = await getSupabase().from("ad_claim").insert({ user_id: userId, ad_id: adId })

  if (error) throw error
}
