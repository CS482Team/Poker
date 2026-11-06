import { supabase } from "@/app/supabaseClient";
import type { Ad, NewAd } from "@shared/Ad";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` };
}

export async function isAdmin(): Promise<boolean> {
  const res = await fetch(`${API_URL}/admin`, { headers: await authHeaders() });
  return res.ok;
}

export async function fetchAds(): Promise<Ad[]> {
  const res = await fetch(`${API_URL}/ads`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load ads (${res.status})`);
  return res.json();
}

export async function createAd(ad: NewAd): Promise<void> {
  const res = await fetch(`${API_URL}/ads`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(ad),
  });
  if (!res.ok) throw new Error(`Failed to save ad (${res.status})`);
}

export async function setAdActive(id: string, active: boolean): Promise<void> {
  const res = await fetch(`${API_URL}/ads/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error(`Failed to update ad (${res.status})`);
}

export async function deleteAd(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/ads/${id}`, { method: "DELETE", headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to delete ad (${res.status})`);
}
