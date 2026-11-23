import AdBanner from "@/component/ads/AdBanner";
import TableList from "@/component/lobby/TableList";

export const metadata = { title: "Tables" };

export default function Dashboard() {
  return (
    <>
      <AdBanner />
      <TableList />
    </>
  );
}
