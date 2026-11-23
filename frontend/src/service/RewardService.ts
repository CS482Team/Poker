import { authHeaders } from "@/service/AuthService";
import type { DailyRewardClaim, DailyRewardStatus } from "@shared/User";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchDailyReward(): Promise<DailyRewardStatus> {
  const res = await fetch(`${API_URL}/users/me/daily-reward`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load daily reward (${res.status})`);
  return res.json();
}

export async function claimDailyReward(): Promise<DailyRewardClaim> {
  const res = await fetch(`${API_URL}/users/me/daily-reward`, { method: "POST", headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to claim daily reward (${res.status})`);
  return res.json();
}
