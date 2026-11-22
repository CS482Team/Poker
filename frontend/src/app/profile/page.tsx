import AdBanner from "@/component/AdBanner";
import MyHistory from "@/component/MyHistory";
import { Suspense } from "react";
import DailyRewards from "@/component/DailyRewards";

export const metadata = { title: "Profile" };

async function Content() {
  return (
    <>
      <AdBanner />
      <MyHistory />
      <DailyRewards />
    </>
  )
}

export default function Profile() {
  return (
    <>
      <Suspense fallback={<div>Loading daily rewards...</div>}>
        <Content />
      </Suspense>
    </>
  );
}
