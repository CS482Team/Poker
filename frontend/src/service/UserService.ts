const USER_KEY = "devUserId";

/* TODO for testing only, replace with the logged in user and delete after auth made */
export const DEV_USERS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "User 1" },
  { id: "00000000-0000-0000-0000-000000000002", name: "User 2" },
];

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

/* gets the id of the user this browser tab is playing as: the signed-in user, else the dev switcher's pick */
export function getCurrentUserId(): string {
  return signedInUserId() ?? sessionStorage.getItem(USER_KEY) ?? DEV_USERS[0].id;
}

/* switches which user this browser tab is playing as */
export function setCurrentUserId(id: string) {
  sessionStorage.setItem(USER_KEY, id);
}
