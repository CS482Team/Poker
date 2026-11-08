import AdBanner from "@/component/AdBanner";
import AdManager from "@/component/AdManager";

export const metadata = { title: "Admin" };

export default function Admin() {
  return (
    <>
      <AdBanner />
      <AdManager />
    </>
  );
}
