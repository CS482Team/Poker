import type { Ad } from "@shared/Ad";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchActiveAds(): Promise<Ad[]> {
  const res = await fetch(`${API_URL}/ads/active`);
  if (!res.ok) throw new Error(`Failed to load ads (${res.status})`);
  return res.json();
}
