import { supabase } from "@/app/supabaseClient";

export async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` };
}
