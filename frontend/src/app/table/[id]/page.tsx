import GameTable from "@/component/GameTable"
import { Suspense } from "react"

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GameTable id={id} />
}

export default function TablePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}
