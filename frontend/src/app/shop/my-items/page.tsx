import AdBanner from "@/component/ads/AdBanner"
import MyItemsPage from "@/component/shop/MyItemsPage"

export const metadata = { title: "My Items" }

/** /shop/my-items: see your look and equip the cosmetics you own. */
export default function MyItems() {
  return (
    <>
      <AdBanner />
      <MyItemsPage />
    </>
  )
}
