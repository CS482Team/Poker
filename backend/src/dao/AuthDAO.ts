import { createClient } from "@supabase/supabase-js"
import { getSupabase } from "../config/Supabase"

/* the email a user signs in with; null for guests */
export async function getEmail(userId: string): Promise<string | null> {
  const { data, error } = await getSupabase().auth.admin.getUserById(userId)

  if (error) throw error

  return data.user.email ?? null
}

/* true if this is the right password for this email */
export async function checkPassword(email: string, password: string): Promise<boolean> {
  // a throwaway client, so the shared one never holds a user's session
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })
  const { error } = await client.auth.signInWithPassword({ email, password })

  return !error
}

/* changes the sign-in email straight away (no confirmation email); false if another account uses it */
export async function setEmail(userId: string, email: string): Promise<boolean> {
  const { error } = await getSupabase().auth.admin.updateUserById(userId, { email, email_confirm: true })

  if (error?.code === "email_exists") return false
  if (error) throw error

  return true
}

/* sets a new password; Supabase hashes it the same way as at sign-up */
export async function setPassword(userId: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.admin.updateUserById(userId, { password })

  if (error) throw error
}