import { authHeaders } from "@/service/AuthService";
import type { Ad } from "@shared/Ad";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchActiveAds(): Promise<Ad[]> {
  const res = await fetch(`${API_URL}/ads/active`);
  if (!res.ok) throw new Error(`Failed to load ads (${res.status})`);
  return res.json();
}

export async function startWatching(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/ads/${id}/watch`, { method: "POST", headers: await authHeaders() });
  if (res.status === 401) throw new Error("Log in to earn chips");
  if (!res.ok) throw new Error(`Failed to start ad (${res.status})`);
}

export async function claimAd(id: string): Promise<number> {
  const res = await fetch(`${API_URL}/ads/${id}/claim`, { method: "POST", headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to claim reward (${res.status})`);
  const { reward } = await res.json();
  return reward;
}
