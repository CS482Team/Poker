"use server";

import type { DailyRewardStatus, Claim} from "../../../shared/User"


export async function getDailyRewardStatus(): Promise<DailyRewardStatus> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/daily-reward`);
  if (!res.ok) throw new Error("Could not fetch daily reward status");
  const body = (await res.json()) as DailyRewardStatus;
  return body;
}

export async function claimDailyReward(day: number): Promise<Claim> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/daily-reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day }),
  });
  if (!res.ok) throw new Error("Could not claim daily reward");
  return (await res.json()) as Claim;
}