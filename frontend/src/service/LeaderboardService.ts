import { authHeaders } from "@/service/AuthService";
import type { Leaderboard, Timeframe } from "@shared/Leaderboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* gets the leaderboard for a timeframe, and the signed-in player's own standing */
export async function fetchLeaderboard(timeframe: Timeframe): Promise<Leaderboard> {
  const res = await fetch(`${API_URL}/users/leaderboard?timeframe=${timeframe}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status})`);
  return res.json();
}
