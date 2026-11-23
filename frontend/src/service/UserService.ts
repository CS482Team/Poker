/* DEMO ONLY: reads the signed-in Supabase user straight from browser storage, where supabase-js
   saves the session, so this stays synchronous for its callers. A real version should use a React
   context fed by supabase.auth.onAuthStateChange. */
function signedInUserId(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null")?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string {
  return signedInUserId() ?? "";
}

export async function fetchUsername(userId: string): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/username`);
  if (!res.ok) throw new Error("Could not load username");
  const body = (await res.json()) as { username: string };
  return body.username;
}
