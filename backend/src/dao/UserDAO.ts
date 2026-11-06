import { getSupabase } from "../config/Supabase"

/* gets a user's chips */
export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await getSupabase().from("user").select("chip_balance").eq("id", userId).single()

  if (error) throw error

  return data.chip_balance
}

/* gets a user's display name */
export async function getUsername(userId: string): Promise<string> {
  const { data, error } = await getSupabase().from("user").select("username").eq("id", userId).single()

  if (error) throw error

  return data.username
}

/* saves a user's new chip total */
export async function setBalance(userId: string, balance: number): Promise<void> {
  const { error } = await getSupabase().from("user").update({ chip_balance: balance }).eq("id", userId)

  if (error) throw error
}
