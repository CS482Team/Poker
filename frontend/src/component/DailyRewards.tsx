import { DAILY_REWARDS } from "@shared/Rules"
import { getDailyRewardStatus } from "@/service/RewardService";
import RewardButton from "./RewardButton"


export default async function DailyRewards() {
  let status = null
  try {
    status = await getDailyRewardStatus()
  } catch (error) {

  }

  return (
    <div>
      {status && DAILY_REWARDS.map((chips, i) => {
        const day = i + 1;
        const available = status && status.canClaim && status.day === day;

        return (
          <div key={day}>
            <RewardButton day={day} chips={chips} available={available}/>
          </div>
        )
      })}

      {status && !status.canClaim && <p>Next reward at {status.nextClaimAt}</p>}
    </div>
  );
}