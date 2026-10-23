"use client"

import Image from "next/image"
import { useState } from "react"
import { act, getView, startGame } from "@/service/Game"
import type { ActionType, PlayerView } from "@/service/Game"
import background from "@/asset/hearts-diamonds-poker-background-hd.png"
import RoomHeader from "@/component/RoomHeader"
import ChatPanel from "@/component/ChatPanel"
import PokerTable from "@/component/PokerTable"
import PlayerHand from "@/component/PlayerHand"
import ActionBar from "@/component/ActionBar"
import HelpButton from "@/component/HelpButton"
import DevSeatSwitch from "@/component/DevSeatSwitch"

// TODO: the viewer becomes the logged-in user once sign-in exists (S7)
const DEFAULT_PLAYER_ID = "bot-0"

// The game room, shown from one player's point of view (their cards only).
// TODO: real rooms and seats come with S12/S14; this page starts a game with the demo bots.
export default function Table() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID)
  const [followTurn, setFollowTurn] = useState(true) // dev: switch to whoever is to act after each move
  const [view, setView] = useState<PlayerView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Runs a backend call, showing "busy" while it runs and any error afterwards
  async function run(task: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  // Loads a player's view; when following the turn, switches to whoever is to act
  async function show(id: string, viewerId: string, follow: boolean) {
    let next = await getView(id, viewerId)
    const toAct = next.toActSeat === null ? undefined : next.players[next.toActSeat]
    if (follow && toAct && toAct.id !== viewerId) {
      viewerId = toAct.id
      next = await getView(id, viewerId)
    }
    setPlayerId(viewerId)
    setView(next)
  }

  const handleDeal = () =>
    run(async () => {
      const { gameId: id } = await startGame()
      setGameId(id)
      await show(id, DEFAULT_PLAYER_ID, followTurn)
    })

  const handleAction = (type: ActionType, amount?: number) =>
    run(async () => {
      if (!gameId) return
      const next = await act(gameId, playerId, type, amount)
      if (followTurn) await show(gameId, playerId, true)
      else setView(next)
    })

  // Picking a seat by hand turns off follow-turn, so the choice sticks
  const handleSelectSeat = (id: string) =>
    run(async () => {
      setFollowTurn(false)
      if (gameId) await show(gameId, id, false)
    })

  const handleFollowTurn = (follow: boolean) =>
    run(async () => {
      setFollowTurn(follow)
      if (gameId && follow) await show(gameId, playerId, true)
    })

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <Image src={background} alt="" fill priority placeholder="blur" className="-z-10 object-cover" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-6">
        <RoomHeader
          stakes="No-limit · min bet 2" // TODO: from the room's settings (S13)
          dealing={busy}
          onDeal={handleDeal}
          devControls={
            view && (
              <DevSeatSwitch
                players={view.players}
                playerId={playerId}
                followTurn={followTurn}
                onSelect={handleSelectSeat}
                onFollowTurnChange={handleFollowTurn}
              />
            )
          }
        />
        <div className="flex gap-8">
          <ChatPanel />
          {/* key: a new game remounts the table, so the deal-in animation plays again */}
          <section key={gameId ?? "empty"} className="flex flex-1 flex-col items-center gap-4 pt-10">
            <PokerTable view={view} />
            {view && <PlayerHand cards={view.you.hand} />}
            {/* key: a new turn resets the bet slider to the new minimum */}
            <ActionBar
              key={`${playerId}-${view?.toActSeat}-${view?.round?.currentBet}`}
              legalActions={view?.you.legalActions ?? []}
              busy={busy}
              status={statusText(view)}
              onAction={handleAction}
            />
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

// The line under the action buttons: whose turn it is, or what happens next
export function statusText(view: PlayerView | null): string {
  if (!view) return "Deal to start a hand"
  if (view.phase === "draw") return "Betting round over: the draw is next (S3)"
  if (view.phase === "showdown") return "Betting over: showdown is next (S4)"
  const toAct = view.toActSeat === null ? undefined : view.players[view.toActSeat]
  if (!toAct) return "Waiting for the next round"
  return toAct.seat === view.you.seat ? `Your turn, ${toAct.name}` : `${toAct.name} to act`
}
