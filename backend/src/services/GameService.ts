import { createGame, startHand } from "../game/Dealer"
import type { Rng } from "../../../shared/Card"
import type { GameState, PlayerId, Result, SeatInput, StartError, TableConfig } from "../../../shared/GameState"
import type { PlayerView } from "../../../shared/PlayerView"
import type { Table } from "../../../shared/Table"
import { getTable } from "../dao/TableDAO"
import { finishMatch, insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import { gameDAO } from "../dao/GameDAO"
import { applyAction, getLegalActions } from "../game/Betting"
import type { ActionError } from "../game/Betting"
import type { PlayerAction } from "../../../shared/Actions"
import { applyDraw } from "../game/Drawer"
import type { DrawError } from "../game/Drawer"
import { scoreHands } from "../game/Ender"
import { isInHand, isPlayersTurn } from "../game/Turn"
import { updateStack } from "../dao/TablePlayersDAO"
import { botDiscard, botBet } from "../game/Bot"

const botNames: string[] = ["NormalPete", "MrBigTime", "QueenOHearts", "UnsaidBot", "U", "JohnnyChristmas", "HowDoIPlay", "PokerFace", "Taks", "McBot"]


const matches = new Map<string, { matchId: string; stacks: number[] }>()

// Table settings from the database → the engine's config
export function configForTable(table: Pick<Table, "ante" | "minimumBet">): TableConfig {
  return {
    ante: table.ante,
    minBet: Math.max(1, table.minimumBet), // the column defaults to 0; a bet must be at least 1 chip
  }
}

// Creates a game at a table, deals the first hand, keeps it in the game store,
// and saves the match rows.
export async function startGame(table: Pick<Table, "id" | "name" | "ante" | "minimumBet">, seats: SeatInput[], rng?: Rng): Promise<Result<GameState, StartError>> {
  const created = createGame(table.id, seats, configForTable(table))
  if (!created.ok) return created
  const started = startHand(created.value, rng)
  if (!started.ok) return started
  
  const game = playBots(started.value) // a bot may be first to act
  gameDAO.save(game)


  const matchNumber = await nextMatchNumber(table.id)
  const matchId = await insertMatch({ tableId: table.id, tableName: table.name, matchNumber, pot: game.pot, dealerSeat: game.dealerIndex })
  await insertMatchPlayers(matchId, game.players.map((p, seat) => ({
    seatNumber: seat,
    userId: p.botFlag ? null : p.id,
    botName: p.botFlag ? p.name : null,
  })))
  matches.set(game.id, { matchId, stacks: game.players.map(p => p.stack + p.totalContributed) })

  return { ok: true, value: game }

}

export function getTableView(tableId: string, userId: PlayerId): PlayerView | null {
  const game = gameDAO.findByTable(tableId)
  return game ? toPlayerView(game, userId) : null
}

function toPlayerView(game: GameState, playerId: PlayerId): PlayerView | null {
  const seat = game.players.findIndex(p => p.id === playerId)
  const me = game.players[seat]
  if (!me) return null

  return {
    gameId: game.id,
    tableId: game.tableId,
    phase: game.phase,
    pot: game.pot,
    handNumber: game.handNumber,
    dealerSeat: game.dealerIndex,
    toActSeat: game.toActIndex,
    round: game.round,
    you: { seat, hand: me.hand, legalActions: getLegalActions(game, playerId) },
    players: game.players.map((p, i) => ({
      seat: i,
      id: p.id,
      name: p.name,
      stack: p.stack,
      status: p.status,
      betThisRound: p.betThisRound,
      cardCount: p.hand.length,
    })),
    winners: game.winners,
    winnings: game.winnings,
  }
}

// Bots for the table: last hand's bots keep their chips and names; new ones get a buy-in and a name not already used
function makeBots(table: Table, lastBots: SeatInput[]): SeatInput[] {
  const count = Math.min(table.botCount, table.maxPlayers - table.seats.length)
  const names = [...botNames].sort(() => Math.random() - 0.5)
  return Array.from({ length: count }, (_, i) =>
    lastBots[i] ?? { id: `bot-${i}`, name: `[BOT] ${names[i]}`, stack: table.buyIn, botFlag: true })
}

export async function startIfReady(tableId: string, lastDealer?: PlayerId, lastBots: SeatInput[] = []): Promise<PlayerId[] | null> {
  if (gameDAO.findByTable(tableId)) return null
  const table = await getTable(tableId)
  if (!table) return null
  if (table.seats.length === 0) return null // bots never play on their own

  const seats: SeatInput[] = [...table.seats]
    .sort((a, b) => a.seatNumber - b.seatNumber)
    .map(s => ({ id: s.userId, name: s.username, stack: s.stack, botFlag: false }))
  seats.push(...makeBots(table, lastBots))
  const dealer = seats.findIndex(s => s.id === lastDealer)
  const started = await startGame(table, [...seats.slice(dealer + 1), ...seats.slice(0, dealer + 1)])
  return started.ok ? seats.map(s => s.id) : null
}

export async function nextHand(tableId: string): Promise<PlayerId[]> {
  const game = gameDAO.findByTable(tableId)
  if (!game || game.phase !== "hand-complete") return []
  await Promise.all(game.players.filter(p => !p.botFlag).map(p => updateStack(tableId, p.id, p.stack)))
  const bots = game.players.filter(p => p.botFlag)
    .map(p => ({ id: p.id, name: p.name, stack: p.stack, botFlag: true }))
  await saveResult(game)
  endGame(tableId)
  return (await startIfReady(tableId, game.players[game.dealerIndex]?.id, bots)) ?? game.players.map(p => p.id)
}

async function saveResult(game: GameState) {
  const match = matches.get(game.id)
  if (!match) return
  matches.delete(game.id)
  const results = game.players.map((p, seat) => ({ seatNumber: seat, netResult: p.stack - match.stacks[seat]! }))
  const pot = game.players.reduce((sum, p) => sum + p.totalContributed, 0)
  const winner = game.players.find(p => p.id === game.winners[0])
  await finishMatch(match.matchId, winner && !winner.botFlag ? winner.id : null, pot, results)
}

export function leaveGame(tableId: string, playerId: PlayerId): GameState | null {
  const found = gameDAO.findByTable(tableId)
  if (!found || found.phase === "hand-complete") return found

  let game: GameState = found
  while (isPlayersTurn(game, playerId)) {
    const result = game.phase === "draw" ? applyDraw(game, playerId, []) : applyAction(game, playerId, { type: "fold" })
    if (!result.ok) break
    game = result.value
  }
  const me = game.players.find(p => p.id === playerId)
  if (me && isInHand(me)) me.status = "folded"
  if (game.phase !== "showdown" && game.players.filter(isInHand).length <= 1) {
    game = { ...game, phase: "showdown", round: null, toActIndex: null }
  }
  game = playBots(game) // a bot shouldn't wait for the player who left
  gameDAO.save(game)
  return game

}

export function endGame(tableId: string) {
  const game = gameDAO.findByTable(tableId)
  if (game) gameDAO.delete(game.id)
}

export type ActError = "game-not-found" | ActionError

export function takeAction(gameId: string, playerId: PlayerId, action: PlayerAction): Result<GameState, ActError> {
  const game = gameDAO.get(gameId)
  if (!game) return { ok: false, error: "game-not-found" }
  const result = applyAction(game, playerId, action) // the person's move
  if (!result.ok) return result
  const next = playBots(result.value) // then any bots after them
  gameDAO.save(next)
  return { ok: true, value: next }

}

export type DrawCardsError = "game-not-found" | DrawError

export function drawCards(gameId: string, playerId: PlayerId, discard: number[]): Result<GameState, DrawCardsError> {
  const game = gameDAO.get(gameId)
  if (!game) return { ok: false, error: "game-not-found" }
  const result = applyDraw(game, playerId, discard)
  if (!result.ok) return result
  const next = playBots(result.value)
  gameDAO.save(next)
  return { ok: true, value: next }
}

/* scores the hand at showdown, and records how many chips each winner took from the pot
   (worked out from stacks before and after the payout, so Ender doesn't need to know about it) */
function finishIfShowdown(game: GameState): GameState {
  if (game.phase !== "showdown") return game
  const before = game.players.map(p => p.stack)
  scoreHands(game)
  game.winnings = Object.fromEntries(
    game.players.map((p, i) => [p.id, p.stack - before[i]!] as const).filter(([, won]) => won > 0),
  )
  return game
}

// Plays every bot whose turn it is, until it's a person's turn or the hand is over.
function playBots(start: GameState): GameState {
  let game = start
  for (let moves = 0; moves < 100; moves++) {
    const bot = game.toActIndex === null ? undefined : game.players[game.toActIndex]
    if (!bot?.botFlag) break
    const result = game.phase === "draw"
      ? applyDraw(game, bot.id, botDiscard(game, bot.id))
      : applyAction(game, bot.id, botBet(game, bot.id))
    const next = result.ok ? result : applyAction(game, bot.id, { type: "fold" })
    if (!next.ok) break
    game = next.value
  }
  return finishIfShowdown(game)
}
