import { getSupabase } from "../config/Supabase"

/* records a balance change in the audit log */
export async function logBalanceChange(userId: string, delta: number, reason: string): Promise<void> {
  const { error } = await getSupabase().from("balance_log").insert({ user_id: userId, delta, reason })

  if (error) throw error
}
