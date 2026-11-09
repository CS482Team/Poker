import AdBanner from "@/component/AdBanner";
import MyHistory from "@/component/MyHistory";

export const metadata = { title: "Profile" };

export default function Profile() {
  return (
    <>
      <AdBanner />
      <MyHistory />
    </>
  );
}
