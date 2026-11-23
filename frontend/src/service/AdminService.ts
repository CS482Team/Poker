import { authHeaders } from "@/service/AuthService";
import type { Ad, NewAd } from "@shared/Ad";
import type { HandRecord, PlayerSummary } from "@shared/PlayerHistory";
import type { Report, ReportDetail, ReportHand } from "@shared/Report";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export async function editAd(id: string, ad: NewAd): Promise<void> {
  const res = await fetch(`${API_URL}/ads/${id}`, {
    method: "PUT",
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

export async function fetchPlayers(): Promise<PlayerSummary[]> {
  const res = await fetch(`${API_URL}/admin/players`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load players (${res.status})`);
  return res.json();
}

export async function fetchPlayerHands(id: string): Promise<HandRecord[]> {
  const res = await fetch(`${API_URL}/admin/players/${id}/hands`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load history (${res.status})`);
  return res.json();
}

export async function fetchReports(): Promise<Report[]> {
  const res = await fetch(`${API_URL}/admin/reports`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
  return res.json();
}

export async function resetPassword(id: number, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/admin/reports/${id}/password`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`Failed to set password (${res.status})`);
  const { email } = await res.json();
  return email;
}

export async function fetchReport(id: number): Promise<ReportDetail> {
  const res = await fetch(`${API_URL}/admin/reports/${id}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
  return res.json();
}

export async function fetchHand(id: string): Promise<ReportHand> {
  const res = await fetch(`${API_URL}/admin/hands/${id}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load hand (${res.status})`);
  return res.json();
}

export async function removePlayer(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/players/${id}`, { method: "DELETE", headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to remove player (${res.status})`);
}

export async function unbanPlayer(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/players/${id}/unban`, { method: "POST", headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to unban player (${res.status})`);
}

export async function modifyChips(id: string, balance: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/players/${id}/balance`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ balance }),
  });
  if (!res.ok) throw new Error(`Failed to modify chips (${res.status})`);
}
