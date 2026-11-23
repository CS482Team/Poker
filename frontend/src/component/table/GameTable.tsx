"use client"

import ActionBar from "@/component/table/ActionBar"
import CardFan from "@/component/table/CardFan"
import Avatar from "@/component/cosmetic/Avatar"
import { NameTagTitle } from "@/component/cosmetic/NameTag"
import ChatPanel from "@/component/table/ChatPanel"
import Dots from "@/component/table/Dots"
import ErrorState from "@/component/common/ErrorState"
import EmoteWheel from "@/component/table/EmoteWheel"
import EmptySeat from "@/component/table/EmptySeat"
import Icon, { LEAVE } from "@/component/common/Icon"
import RoomSettings from "@/component/table/RoomSettings"
import { clearCurrentTableId } from "@/service/CurrentTableService"
import { act, draw, playAgain } from "@/service/GameService"
import { watchEmotes, type EmoteConnection } from "@/service/EmoteService"
import { playEffect } from "@/service/SoundService"
import { watchTable } from "@/service/SocketService"
import { fetchTable, leaveTable } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"
import { soundsForViewChange } from "@/util/Sound"
import PlayerHand from "@/component/table/PlayerHand"
import { useMyLoadout } from "@/hook/useMyLoadout"
import type { EmotePlayed, ShopItem } from "@shared/Cosmetics"
import type { ActionType } from "@shared/Actions"
import type { PlayerView, PublicPlayer } from "@shared/PlayerView"
import type { Seat, Table } from "@shared/Table"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// how long an emote stays up over a player's seat
const EMOTE_SHOW_MS = 3000

/* [left %, top %] of each seat around the table, for a table of 1 to 6 seats */
const SEAT_SPOTS = [
  [],
  [[50, 12]],
  [[17, 24], [83, 24]],
  [[17, 24], [50, 12], [83, 24]],
  [[17, 24], [38, 12], [62, 12], [83, 24]],
  [[4, 67], [18, 26], [50, 12], [82, 26], [96, 67]],
  [[4, 67], [18, 26], [40, 12], [60, 12], [82, 26], [96, 67]],
]

/* where seat `i` of a `count`-seat table sits */
function seatPosition(i: number, count: number) {
  const [left, top] = SEAT_SPOTS[count]![i]!
  return { left: `${left}%`, top: `${top}%` }
}

export default function GameTable({ id }: { id: string }) {
  const router = useRouter()
  const [table, setTable] = useState<Table | null>(null)
  const [view, setView] = useState<PlayerView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!view?.turnEndsAt && !view?.playAgain) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [view?.turnEndsAt, view?.playAgain])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const canDraw = view?.phase === "draw" && view.toActSeat === view.you.seat
  const spectating = view?.you.seat === -1
  const tableSeats = table?.seats ?? []
  const openSeats = Array.from({ length: table?.maxPlayers ?? 0 }, (_, n) => n).filter(n => !tableSeats.some(s => s.seatNumber === n))
  const botSeats = (view?.players ?? [])
  .filter(p => !tableSeats.some(s => s.userId === p.id))
  .map((p, i) => ({ userId: p.id, username: p.name, seatNumber: openSeats[i]!, stack: p.stack }))
  // typed as Seat so bots (which have no cosmetics) and players share one shape
  const seats: Seat[] = [...tableSeats, ...botSeats]
  const myLoadout = useMyLoadout()
  const wheel = [myLoadout.emote_1, myLoadout.emote_2, myLoadout.emote_3, myLoadout.emote_4]
  const seated = tableSeats.some((s) => s.userId === getCurrentUserId())
  const [bubbles, setBubbles] = useState<Record<string, { emote: ShopItem; key: number }>>({})
  const emotes = useRef<EmoteConnection | null>(null)
  const lastView = useRef<PlayerView | null>(null)

  useEffect(() => {
    fetchTable(id)
      .then((loaded) => {
        setTable(loaded)
        setError(null)
      })
      .catch((err: Error) => {
        clearCurrentTableId()
        setError(err.message)
      })
    return watchTable(id, setTable, setView)
  }, [id])

  function showEmote({ userId, emote }: EmotePlayed) {
    playEffect("emote")
    const key = Date.now() + Math.random()
    setBubbles((current) => ({ ...current, [userId]: { emote, key } }))
    // remove it later, unless a newer emote from the same player has replaced it by then
    setTimeout(() => {
      setBubbles((current) => {
        if (current[userId]?.key !== key) return current
        const rest = { ...current }
        delete rest[userId]
        return rest
      })
    }, EMOTE_SHOW_MS)
  }

  useEffect(() => {
    const connection = watchEmotes(id, showEmote)
    emotes.current = connection
    return () => connection.stop()
  }, [id])

  // the sounds for whatever just changed: a deal, someone's action, your turn, a win
  useEffect(() => {
    soundsForViewChange(lastView.current, view).forEach((sound) => playEffect(sound))
    lastView.current = view
  }, [view])

  useEffect(() => {
    if (!canDraw) setSelected([])
  }, [canDraw])

  async function leave() {
    try {
      await leaveTable(id)
      clearCurrentTableId()
      router.push("/dashboard")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleAction(type: ActionType, amount?: number) {
    if (!view) return
    setBusy(true)
    setActionError(null)
    try {
      await act(view.gameId, type, amount)
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function toggleCard(i: number) {
    if (selected.includes(i)) setSelected(selected.filter((x) => x !== i))
    else setSelected([...selected, i])
  }

  async function handleDraw() {
    if (!view) return
    setBusy(true)
    setActionError(null)
    try {
      await draw(view.gameId, selected)
      setSelected([])
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error) return <ErrorState title="Table Unavailable" message={`${error}. It may have closed.`} />
  if (!table) return <p className="page-shell text-lg text-[#d8cfcf]">Loading table…</p>

  return (
    <div className={`mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-8 sm:px-6 md:gap-x-12 md:gap-y-12 xl:gap-x-14 ${table.chatEnabled ? "md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 md:col-span-full">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={leave} className="secondary-action small shrink-0 gap-1.5">
          <Icon d={LEAVE} size={14} />
          Leave
        </button>
        <h1 className="min-w-0 truncate text-3xl font-bold">{table.name}</h1>
        {table.hostId === getCurrentUserId() && (
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Table settings" className="text-xl leading-none text-white/70 hover:text-white">
            ⋮
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#d8cfcf]">
        <span>Min Bet <b className="ml-1 text-base text-white">${table.minimumBet}</b></span>
        <span>Ante <b className="ml-1 text-base text-white">${table.ante}</b></span>
        <span>Buy-in <b className="ml-1 text-base text-white">${table.buyIn}</b></span>
        <span>Max Players <b className="ml-1 text-base text-white">{table.maxPlayers}</b></span>
      </div>
      </div>
      {table.chatEnabled && (
        <div className="order-last h-[28rem] md:order-none md:h-[520px]">
          <ChatPanel
            tableId={table.id}
            userId={getCurrentUserId()}
            seated={table.seats.some((seat) => seat.userId === getCurrentUserId())}
          />
        </div>
      )}
      <div className="relative isolate mx-auto w-full min-w-0 max-w-[780px] px-2 sm:px-0 md:mt-10">
        <div className="poker-table relative h-[436px] rounded-[44%/50%]">
          {/* once the hand is paid out, the pot glides to the winner (each share to its winner in a split pot);
              the words stay for screen readers */}
          {view && Object.keys(view.winnings ?? {}).length > 0 ? (
            <>
              <p className="sr-only" role="status">{winnerText(view)}</p>
              {Object.entries(view.winnings).map(([winnerId, chips]) => {
                const seat = seats.find((s) => s.userId === winnerId)
                if (!seat) return null
                const to = seatPosition(seat.seatNumber, table.maxPlayers)
                return (
                  <div
                    key={winnerId}
                    data-pot-slide
                    aria-hidden
                    className="pot pot-slide"
                    style={{ "--to-left": to.left, "--to-top": to.top } as React.CSSProperties}
                  >
                    <span className="chip" />
                    <strong>${chips.toLocaleString()}</strong>
                  </div>
                )
              })}
            </>
          ) : (
            view && (
              <div className="pot">
                <span className="chip" aria-hidden />
                <small>Pot</small>
                <strong>${view.pot.toLocaleString()}</strong>
              </div>
            )
          )}
          {view && (
            <p className={`absolute bottom-[72px] left-1/2 -translate-x-1/2 whitespace-nowrap text-base ${actionError ? "text-red-300" : "text-white/75"}`}>
              <span>{actionError ?? statusText(view)}</span>
              {!actionError && view.turnEndsAt && <span className="ml-2 tabular-nums text-white/50">{secondsLeft(view.turnEndsAt, now)}s</span>}
              {!actionError && view.toActSeat !== view.you.seat && <Dots />}
            </p>
          )}
          {/* every seat has a fixed spot by seat number, so players don't move as others join or leave */}
          {Array.from({ length: table.maxPlayers }, (_, seatNumber) => {
            const seat = seats.find((s) => s.seatNumber === seatNumber)
            const position = seatPosition(seatNumber, table.maxPlayers)
            if (!seat) {
              return (
                <div key={`open-${seatNumber}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={position}>
                  <EmptySeat />
                </div>
              )
            }
            const mine = seat.userId === getCurrentUserId()
            const name = mine ? "Me" : seat.username
            // the game's view of this player; `live.seat` is their place in the game's turn order, not the table seat
            const live = view?.players.find((p) => p.id === seat.userId)
            const won = view?.winners.includes(seat.userId)
            const bot = !tableSeats.some((s) => s.userId === seat.userId)
            const folded = live?.status === "folded"
            const watching = view !== null && !live
            const toAct = live !== undefined && live.seat === view?.toActSeat
            const dealer = live !== undefined && live.seat === view?.dealerSeat
            const fanned = live && live.cardCount > 0 && (!folded || live.cards)
            // winning (gold) and bot (blue) rings beat a border's colour; the turn ring is drawn
            // separately ("on-turn") so a glowing border never looks like a turn indicator
            const border = bot ? undefined : seat.cosmetics?.avatar_border
            const portraitStyle = (
              bot && !won ? { borderColor: "#72bbea" } : border && !won ? { borderColor: border.style.color, "--ring": border.style.color } : undefined
            ) as React.CSSProperties | undefined
            const ringAnimation = border?.style.animation ? `animate-${border.style.animation}` : ""
            return (
              <div
                key={seat.userId}
                data-seat
                className={`absolute -translate-x-1/2 -translate-y-1/2 text-center transition-opacity ${folded || watching ? "opacity-50" : ""}`}
                style={position}
              >
                {/* the fan sits above the portrait, which covers just the bottom of the cards (like the mockup) */}
                <div className="relative">
                  {fanned && (
                    <div
                      role="img"
                      aria-label={mine ? `You have ${live.cardCount} cards` : `${name} has ${live.cardCount} cards`}
                      className="absolute bottom-[calc(100%-18px)] left-1/2 -translate-x-1/2"
                    >
                      <CardFan count={live.cardCount} cards={live.cards} back={seat.cosmetics?.card_back} />
                    </div>
                  )}
                  {bubbles[seat.userId] && (
                    <div key={bubbles[seat.userId]!.key} role="img" aria-label={`${name} played ${bubbles[seat.userId]!.emote.name}`} className="emote-bubble">
                      {bubbles[seat.userId]!.emote.style.text}
                    </div>
                  )}
                  {won && (
                    <svg viewBox="0 0 24 16" fill="#e8b84a" aria-label="Winner" className="absolute -top-3 left-1/2 z-10 h-5 w-7 -translate-x-1/2">
                      <path d="M0 16 L2 4 L7 9 L12 0 L17 9 L22 4 L24 16 Z" />
                    </svg>
                  )}
                  <div
                    className={`seat-portrait ${won ? "winner" : ""} ${toAct ? "on-turn" : ""} ${bot ? "bot" : ""} ${ringAnimation}`}
                    style={portraitStyle}
                  >
                    {bot ? <span className="text-xl font-bold text-[#72bbea]">BOT</span> : <Avatar username={name} url={seat.cosmetics?.avatar?.assetUrl ?? seat.avatarUrl} />}
                    {dealer && (
                      <span className="dealer-chip" aria-label="Dealer">
                        D
                      </span>
                    )}
                  </div>
                </div>
                <div className="seat-label">
                  <span>{name}</span>
                  <small>${(live?.stack ?? seat.stack).toLocaleString()}</small>
                </div>
                {!bot && seat.cosmetics?.name_tag && <NameTagTitle tag={seat.cosmetics.name_tag} className="seat-tag" />}
                {watching && <small>Spectating</small>}
                {live && actionText(live) && <small>{actionText(live)}</small>}
              </div>
            )
          })}
        </div>
        {(seated || (view && !spectating)) && (
          <div className="relative z-10 -mt-12 min-h-14">
            {view && !spectating && (
              <PlayerHand
                cards={view.you.hand}
                selected={selected}
                canSelect={canDraw && !busy}
                onToggle={toggleCard}
              />
            )}
            {seated && (
              <div className="absolute bottom-2 right-0 z-20">
                <EmoteWheel wheel={wheel} onSend={(slot) => emotes.current?.send(slot) ?? Promise.resolve({ ok: false, error: "Not connected yet" })} />
              </div>
            )}
          </div>
        )}
        {canDraw && view && (
          <div className="mt-6 flex min-h-[3.25rem] items-center justify-center gap-4">
            <p aria-live="polite" className="text-sm text-[#d8cfcf]">
              {discardText(selected.length, view.you.hand.length)}
            </p>
            <button type="button" onClick={handleDraw} disabled={busy} className="secondary-action">
              Draw
            </button>
          </div>
        )}
        {view?.playAgain && !spectating && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => playAgain(view.gameId).catch((e: Error) => setActionError(e.message))} disabled={view.playAgain.voted} className="secondary-action">
              {view.playAgain.voted ? "Waiting for others" : "Play Again?"}
            </button>
            <p className="text-sm text-[#d8cfcf]">
              {view.playAgain.votes}/{view.playAgain.needed} ready
              {view.playAgain.readyAt > now && ` · next hand in ${secondsLeft(view.playAgain.readyAt, now)}s`}
            </p>
          </div>
        )}
        {view && !canDraw && !spectating && view.toActSeat === view.you.seat && (
          <div className="mt-6">
            <ActionBar
              key={`${view.toActSeat}-${view.round?.currentBet}`}
              legalActions={view.you.legalActions}
              busy={busy}
              onAction={handleAction}
            />
          </div>
        )}
      </div>
      {settingsOpen && <RoomSettings table={table} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

/* who won the hand and how much: "You won 120 chips", "Maya won 120 chips"; a split pot lists each share */
function winnerText(view: PlayerView): string {
  const myId = view.players[view.you.seat]?.id
  return Object.entries(view.winnings)
    .map(([id, chips]) => {
      const who = id === myId ? "You" : (view.players.find((p) => p.id === id)?.name ?? "A player")
      return `${who} won ${chips.toLocaleString()} ${chips === 1 ? "chip" : "chips"}`
    })
    .join(" · ")
}

function actionText(p: PublicPlayer): string | null {
  if (p.status === "folded") return "Folded"
  if (p.handName) return p.handName
  if (p.lastAction === "check") return "Check"
  if (p.lastAction === "call") return `Call $${p.betThisRound}`
  if (p.lastAction === "bet") return `Bet $${p.betThisRound}`
  if (p.lastAction === "raise") return `Raise $${p.betThisRound}`
  return null
}

/* tells the player what pressing Draw will do, e.g. "Discarding 2 cards" */
function discardText(discarding: number, handSize: number): string {
  if (discarding === 0) return `Keeping all ${handSize} cards`
  return `Discarding ${discarding} ${discarding === 1 ? "card" : "cards"}`
}

function secondsLeft(at: number, now: number) {
  return Math.max(0, Math.ceil((at - now) / 1000))
}

function statusText(view: PlayerView): string {
  if (view.phase === "draw") {
    return view.toActSeat === view.you.seat ? "Pick cards to replace" : "Waiting for others to draw"
  }
  const toAct = view.toActSeat === null ? undefined : view.players[view.toActSeat]
  if (!toAct) return "Round over, waiting for next round"
  return toAct.seat === view.you.seat ? "Your turn" : `${toAct.name} to act`
}
