import AdBanner from "@/component/AdBanner"
import MyItemsPage from "@/component/MyItemsPage"

export const metadata = { title: "My items" }

/** /shop/my-items: see your look and equip the cosmetics you own. */
export default function MyItems() {
  return (
    <>
      <AdBanner />
      <MyItemsPage />
    </>
  )
}
