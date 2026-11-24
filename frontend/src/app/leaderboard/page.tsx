import AdBanner from "@/component/ads/AdBanner";
import Leaderboard from "@/component/Leaderboard";

export const metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <>
      <AdBanner />
      <Leaderboard />
    </>
  );
}
