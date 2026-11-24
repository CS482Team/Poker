import AdBanner from "@/component/ads/AdBanner"
import FriendsPage from "@/component/friends/FriendsPage"

export const metadata = { title: "Friends" }

/** /friends: your friends (and where to join them), requests, and players from your recent games */
export default function Friends() {
  return (
    <>
      <AdBanner />
      <FriendsPage />
    </>
  )
}
