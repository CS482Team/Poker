import AdBanner from "@/component/AdBanner";
import MyHistory from "@/component/MyHistory";
import ProfileCard from "@/component/ProfileCard";

export const metadata = { title: "Profile" };

export default function Profile() {
  return (
    <>
      <AdBanner />
       {/* one heading for the page; the card and the history are sections under it */}
       <div className="page-shell">
         <div className="page-header">
           <h1 className="page-title">Profile</h1>
         </div>
         <ProfileCard />
         <MyHistory />
       </div>
    </>
  );
}
