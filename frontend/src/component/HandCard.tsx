import type { Card } from "@shared/Card"
import type { HandAction, ReportHand } from "@shared/Report"

const SUITS = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" }
const FACES: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" }
const STREETS = ["Before draw", "Draw", "After draw"]
const VERBS: Record<string, string> = { fold: "folded", check: "checked", call: "called", bet: "bet", raise: "raised", left: "left the table" }

export default function HandCard({ hand }: { hand: ReportHand }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <h3 className="font-semibold">Hand #{hand.handNumber}</h3>
        <small>
          Pot ${hand.pot.toLocaleString()} · {outcome(hand)}
        </small>
      </div>

      <ul className="divide-y divide-white/5 px-4">
        {hand.players.map((player) => (
          <li key={player.seat} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 text-sm">
            <div className="w-32">
              <p className="truncate font-medium">{player.name}</p>
              {player.handRank && <small>{player.handRank}</small>}
            </div>
            <div className="flex items-center gap-2">
              <Cards cards={player.dealt} />
              {player.final && (
                <>
                  <span className="text-[#7d7373]">→</span>
                  <Cards cards={player.final} />
                </>
              )}
            </div>
            {hand.endedAt && <span className={`ml-auto font-medium tabular-nums ${resultColor(player.netResult)}`}>{money(player.netResult)}</span>}
          </li>
        ))}
      </ul>

      <div className="border-t border-white/10 px-4 py-3">
        {hand.actions.length === 0 ? <small>No actions recorded.</small> : <Actions hand={hand} />}
      </div>
    </article>
  )
}

function Actions({ hand }: { hand: ReportHand }) {
  const firstDraw = hand.actions.findIndex((a) => a.type === "draw")
  const rows = hand.actions.map((action, i) => ({
    action,
    street: action.type === "draw" ? "Draw" : firstDraw >= 0 && i > firstDraw ? "After draw" : "Before draw",
  }))

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STREETS.map((street) => {
        const list = rows.filter((row) => row.street === street)
        return (
          <div key={street}>
            <p className="mb-1.5 text-xs text-[#9e9393]">{street}</p>
            {list.length === 0 ? (
              <small>—</small>
            ) : (
              <ul className="grid gap-1 text-sm">
                {list.map(({ action }, i) => (
                  <li key={i}>
                    <span className="font-medium">{hand.players.find((p) => p.seat === action.seat)?.name ?? `Seat ${action.seat + 1}`}</span> <span className="text-[#d8cfcf]">{describe(action)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Cards({ cards }: { cards: Card[] }) {
  return (
    <span className="inline-flex gap-1">
      {cards.map((card, i) => (
        <span
          key={i}
          className={`grid h-7 min-w-7 place-items-center rounded bg-[#f5f2ef] px-1 text-xs font-bold ${card.suit === "hearts" || card.suit === "diamonds" ? "text-[#c62f2f]" : "text-[#1b1717]"}`}
        >
          {FACES[card.rank] ?? card.rank}
          {SUITS[card.suit]}
        </span>
      ))}
    </span>
  )
}

function outcome(hand: ReportHand) {
  if (!hand.endedAt) return "In progress"
  const winners = hand.players.filter((p) => p.netResult > 0)
  return winners.map((p) => `${p.name} won $${p.netResult.toLocaleString()}`).join(", ") || "No winner"
}

function describe(action: HandAction) {
  if (action.type === "draw") return action.cardsDiscarded ? `drew ${action.cardsDiscarded}` : "stood pat"
  const verb = VERBS[action.type] ?? action.type
  return action.amount > 0 ? `${verb} $${action.amount.toLocaleString()}` : verb
}

function money(amount: number) {
  return `${amount < 0 ? "-" : amount > 0 ? "+" : ""}$${Math.abs(amount).toLocaleString()}`
}

function resultColor(net: number) {
  if (net > 0) return "text-[#6fd099]"
  if (net < 0) return "text-red-300"
  return ""
}
