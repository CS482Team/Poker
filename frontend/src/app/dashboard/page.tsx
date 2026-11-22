import AdBanner from "@/component/AdBanner";
import TableList from "@/component/TableList";
import DailyRewards from "@/component/DailyRewards";
import { Suspense } from "react";

export const metadata = { title: "Tables" };

export default function Dashboard() {
  return (
    <>
      <AdBanner />
      <TableList />
      <Suspense fallback={<div>Loading daily rewards...</div>}>
        <DailyRewards />
      </Suspense>
    </>
  );
}
