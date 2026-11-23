import AdBanner from "@/component/ads/AdBanner"
import Shop from "@/component/shop/Shop"

export const metadata = { title: "Shop" }

/** /shop: buy cosmetics (avatars, card backs, borders, name tags, emotes) with chips. */
export default function ShopPage() {
  return (
    <>
      <AdBanner />
      <Shop />
    </>
  )
}
