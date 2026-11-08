import AdBanner from "@/component/AdBanner";
import TableList from "@/component/TableList";

export const metadata = { title: "Tables" };

export default function Dashboard() {
  return (
    <>
      <AdBanner />
      <TableList />
    </>
  );
}
