"use client"

import Image from "next/image"
import { useState } from "react"
import { dealDemo } from "@/service/Game"
import type { DemoDeal } from "@/service/Game"
import background from "@/asset/hearts-diamonds-poker-background-hd.png"
import RoomHeader from "@/component/RoomHeader"
import ChatPanel from "@/component/ChatPanel"
import PokerTable from "@/component/PokerTable"
import PlayerHand from "@/component/PlayerHand"
import ActionBar from "@/component/ActionBar"
import HelpButton from "@/component/HelpButton"

// TODO: demo game room; real rooms come with S12/S14
export default function Table() {
  const [deal, setDeal] = useState<DemoDeal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealAll, setRevealAll] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  async function handleDeal() {
    setLoading(true)
    setError(null)
    try {
      setDeal(await dealDemo())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deal failed")
    } finally {
      setLoading(false)
    }
  }

  // Add the position if it isn't picked, remove it if it is
  const toggleCard = (i: number) =>
  setSelected(s => (s.includes(i) ? s.filter(x => x !== i) : [...s, i]))


  const canDraw = view?.phase === "draw" && view.toActSeat === view.you.seat


  {view && (

    <PlayerHand
        cards={view.you.hand}
        selected={selected}
        canSelect={canDraw && !busy}
        onToggle={toggleCard}
    />
  )

  const you = deal?.players.find(p => p.seat === 0)
  const toAct = deal?.players.find(p => p.seat === deal.toActSeat)

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <Image src={background} alt="" fill priority placeholder="blur" className="-z-10 object-cover" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-6">
        <RoomHeader
          stakes="Stakes 2 / 4"
          dealing={loading}
          revealAll={revealAll}
          onDeal={handleDeal}
          onToggleReveal={() => setRevealAll(r => !r)}
        />
        <div className="flex gap-8">
          <ChatPanel />
          {/* key: a new deal remounts the table, so the deal-in animation plays again */}
          <section key={deal?.matchId ?? "empty"} className="flex flex-1 flex-col items-center gap-4 pt-10">
            <PokerTable deal={deal} revealAll={revealAll} />
            {you && <PlayerHand cards={you.hand} />}
            <ActionBar status={toAct ? `${toAct.name} to act` : "Betting coming in S2"} />
          </section>
        </div>
      </div>

      {error && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded bg-panel px-4 py-2 text-fold shadow-lg">{error}</p>
      )}
      <HelpButton />
    </main>
  )
}