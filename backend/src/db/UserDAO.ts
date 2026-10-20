import { supabase } from "./supabase"

/* gets a user's chips */
export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.from("user").select("chip_balance").eq("id", userId).single()

  if (error) throw error

  return data.chip_balance
}

/* saves a user's new chip total */
export async function setBalance(userId: string, balance: number): Promise<void> {
  const { error } = await supabase.from("user").update({ chip_balance: balance }).eq("id", userId)

  if (error) throw error
}
