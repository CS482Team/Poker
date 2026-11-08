import AdBanner from "@/component/AdBanner"
import GameTable from "@/component/GameTable"
import { Suspense } from "react"

export const metadata = { title: "Game" }

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <AdBanner />
      <GameTable id={id} />
    </>
  )
}

export default function TablePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}
