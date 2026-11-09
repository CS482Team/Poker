import type { LegalAction, PlayerAction } from "../../../shared/Actions"
import type { Rng } from "../../../shared/Card"
import type { GameState, PlayerId, PlayerState } from "../../../shared/GameState"
import { getLegalActions } from "./Betting"
import { returnScore, setRanks } from "./Ender"

// Bot decisions. These only choose a move; GameService applies it with applyAction / applyDraw,
// so a bot plays by exactly the same rules as a person.

const INCREMENT = 14 // one "rank up" of happiness (one hand category)

type BetRaise = Extract<LegalAction, { min: number }>

/* Score function:
- Use Ender.ts to evaluate the hand (works on a copy, so the real player isn't changed)
- happiness = hand category * 14 + its top card; straight or better is above 56 */
function botScore(b: PlayerState, state: GameState, rng: Rng): number {
  const copy: PlayerState = { ...b, winningRanks: [] }
  const [suits, ranks] = setRanks(copy)
  const score = returnScore(copy, ranks, suits)
  const highCardVal = copy.winningRanks[0] ?? 0
  let happiness = (score - 1) * INCREMENT + highCardVal
  if (b.botBluff) happiness += INCREMENT
  if (state.phase === "predraw-betting") happiness += drawPotential(b, rng)
  return happiness
}

/* Draw potential (only before the draw): one card off a flush or a straight is worth a rank up,
   and ~10% of the time the bot decides to bluff this hand */
function drawPotential(b: PlayerState, rng: Rng): number {
  let bonus = 0
  // Close to flush: 4 of the same suit
  const suitCounts = new Map<string, number>()
  for (const c of b.hand) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1)
  if ([...suitCounts.values()].some(n => n === 4)) bonus += INCREMENT
  // Close to straight: 4 different ranks in a row
  const unique = [...new Set(b.hand.map(c => c.rank))].sort((x, y) => x - y)
  if (unique.some((r, i) => unique[i + 3] === r + 3)) bonus += INCREMENT
  // 10%ish chance to bluff, adding a rank up of confidence for the rest of the hand
  if (!b.botBluff && rng() > 0.9) b.botBluff = true
  return bonus
}

/* Discard: returns the positions (0-4) of the cards to throw away.
- Straight or better keeps everything (four of a kind sometimes throws its odd card)
- Pairs, two pair and three of a kind keep the matching cards and throw the rest
- High card keeps its top 2 cards (top 3 when bluffing) */
export function botDiscard(state: GameState, botId: PlayerId, rng: Rng = Math.random): number[] {
  const b = state.players.find(p => p.id === botId)!
  const counts = new Map<number, number>()
  for (const c of b.hand) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
  const unmatched = b.hand.map((c, i) => ({ i, rank: c.rank })).filter(c => counts.get(c.rank) === 1)

  const copy: PlayerState = { ...b, winningRanks: [] }
  const [suits, ranks] = setRanks(copy)
  const score = returnScore(copy, ranks, suits)

  if (score === 8) return rng() > 0.5 ? unmatched.map(c => c.i) : [] // four of a kind
  if (score >= 5) return [] // straight, flush, full house, straight flush
  if (score >= 2) return unmatched.map(c => c.i) // pair, two pair, three of a kind
  // high card: throw the lowest 3 (2 when bluffing)
  const lowestFirst = [...unmatched].sort((x, y) => x.rank - y.rank)
  return lowestFirst.slice(0, b.botBluff ? 2 : 3).map(c => c.i)
}

/* Betting: picks fold / check / call / bet / raise from what's legal right now.
- Happier bots bet and raise more, and call bigger bets
- Bet and raise amounts are "to" amounts, kept between the legal min and max (all-in) */
export function botBet(state: GameState, botId: PlayerId, rng: Rng = Math.random): PlayerAction {
  const b = state.players.find(p => p.id === botId)!
  let happiness = botScore(b, state, rng)
  // 10% chance to rank down, 10% to rank up
  const happinessRand = rng()
  if (happinessRand <= 0.1) happiness -= INCREMENT
  else if (happinessRand >= 0.9) happiness += INCREMENT
  // extra confidence sometimes before the draw
  if (state.phase === "predraw-betting" && rng() >= 0.85) happiness += INCREMENT

  const legal = getLegalActions(state, botId)
  const bet = legal.find((a): a is BetRaise => a.type === "bet")
  const raise = legal.find((a): a is BetRaise => a.type === "raise")
  const canCheck = legal.some(a => a.type === "check")
  const canCall = legal.some(a => a.type === "call")
  const minBet = state.config.minBet
  const currentBet = state.round?.currentBet ?? 0
  const minRaise = state.round?.minRaise ?? minBet

  /* a whole number of chips inside the legal range */
  const sized = (option: BetRaise, to: number): PlayerAction =>
    ({ type: option.type, amount: Math.min(option.max, Math.max(option.min, Math.round(to))) })

  if (canCheck) {
    // Bet: happiness 42 or more
    if (bet && happiness >= 42) return sized(bet, minBet + rng() * happiness * 0.5)
    // Check: anything else (checking is free, so never fold here)
    return { type: "check" }
  }

  // Facing a bet: the bigger it is, the happier the bot needs to be to stay in
  const tiers = [
    { from: minBet * 5, raiseAt: 84, callAt: 42, size: 0.75 },
    { from: minBet * 3, raiseAt: 56, callAt: 28, size: 0.5 },
    { from: minBet, raiseAt: 42, callAt: 25, size: 0.25 },
    { from: 0, raiseAt: 42, callAt: 12, size: 0.25 },
  ]
  const tier = tiers.find(t => currentBet >= t.from)!
  if (raise && happiness >= tier.raiseAt) return sized(raise, currentBet + minRaise + rng() * happiness * tier.size)
  if (canCall && happiness >= tier.callAt) return { type: "call" }
  return { type: "fold" }
}
