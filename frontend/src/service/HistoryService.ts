import { authHeaders } from "@/service/AuthService";
import type { HandRecord } from "@shared/PlayerHistory";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* gets the signed-in user's own hands */
export async function fetchMyHands(): Promise<HandRecord[]> {
  const res = await fetch(`${API_URL}/users/me/hands`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load history (${res.status})`);
  return res.json();
}