"use client";

import { claimDailyReward } from "@/service/RewardService";
import Icon from "./Icon";
import { LOCK } from "./Icon";

export default function RewardButton({ day, chips, available }: { day: number, chips: number, available: boolean }) {
  
  async function handleClaim() {
    try {
      const res = await claimDailyReward(day);
    } catch (e) {
    }
  }

  return (
    <button 
      type="button" 
      disabled={!available} 
      onClick={handleClaim} 
      aria-label={`Day ${day}: $${chips}`}
    >
      <span>Day {day}</span>
      <b>${chips.toLocaleString()}</b>
      {!available && <Icon d={LOCK} size={14} />}
    </button>
  );
}