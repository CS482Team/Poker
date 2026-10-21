import { supabase } from "./SupabaseClient"

/* records a balance change in the audit log */
export async function logBalanceChange(userId: string, delta: number, reason: string): Promise<void> {
  const { error } = await supabase.from("balance_log").insert({ user_id: userId, delta, reason })

  if (error) throw error
}
