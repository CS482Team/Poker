import AdBanner from "@/component/ads/AdBanner";
import MyHistory from "@/component/profile/MyHistory";
import ProfileCard from "@/component/profile/ProfileCard";

export const metadata = { title: "Profile" };

export default function Profile() {
  return (
    <>
      <AdBanner />
      <div className="page-shell">
        <ProfileCard />
        <MyHistory />
      </div>
    </>
  );
}
