import { supabase } from "@/app/supabaseClient";

/* the signed in player's session token, or undefined when signed out */
export async function accessToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export function socketAuth(send: (data: { token?: string }) => void) {
  accessToken().then((token) => send({ token }));
}

export async function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}` };
}
