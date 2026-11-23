import AdBanner from "@/component/AdBanner";
import MyHistory from "@/component/MyHistory";
import ProfileCard from "@/component/ProfileCard";

export const metadata = { title: "Profile" };

export default function Profile() {
  return (
    <>
      <AdBanner />
      <ProfileCard />
      <MyHistory />
    </>
  );
}
