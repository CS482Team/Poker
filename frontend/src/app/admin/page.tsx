import AdBanner from "@/component/AdBanner";
import AdminPanel from "@/component/AdminPanel";

export const metadata = { title: "Admin" };

export default function Admin() {
  return (
    <>
      <AdBanner />
      <AdminPanel />
    </>
  );
}
