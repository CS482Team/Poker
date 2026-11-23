import type { Request, Response } from "express"
import type { ActionType, PlayerAction } from "../../../shared/Actions"
import type { GameState } from "../../../shared/GameState"
import { closeVote, drawCards, hasVote, humanTurn, isBotTurn, nextHand, openVote, playBot, setTurnDeadline, setVoteNeeded, takeAction, timeOut, voteToPlayAgain, voteWon } from "../services/GameService"
import { getTable } from "../dao/TableDAO"
import type { ActError, DrawCardsError } from "../services/GameService"
import { sendViews } from "../socket/io"

const NEXT_HAND_DELAY = 10000
const TURN_TIME = 30000
const BOT_MIN_DELAY = 1000
const BOT_MAX_DELAY = 10000
const waitingBots = new Set<string>()
const turnTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function sendGame(game: GameState) {
  sendViews(game.tableId)
  if (game.phase === "hand-complete") {
    stopTurnTimer(game.tableId)
    startVote(game.tableId).catch(console.error)
  } else {
    playBotLater(game.tableId)
    startTurnTimer(game.tableId).catch(console.error)
  }
}

async function startVote(tableId: string) {
  if (hasVote(tableId)) return
  const table = await getTable(tableId)
  if (!table) return
  openVote(tableId, Math.ceil(table.seats.length / 2), Date.now() + NEXT_HAND_DELAY)
  sendViews(tableId)
  setTimeout(() => dealIfVoted(tableId).catch(console.error), NEXT_HAND_DELAY)
}

export async function recountVote(tableId: string) {
  const table = await getTable(tableId)
  if (!table) return
  setVoteNeeded(tableId, Math.ceil(table.seats.length / 2))
  await dealIfVoted(tableId)
}

async function dealIfVoted(tableId: string) {
  if (!voteWon(tableId)) return
  closeVote(tableId)
  await dealNextHand(tableId)
}

function stopTurnTimer(tableId: string) {
  clearTimeout(turnTimers.get(tableId))
  turnTimers.delete(tableId)
  setTurnDeadline(tableId, null)
}

async function startTurnTimer(tableId: string) {
  stopTurnTimer(tableId)
  const turn = humanTurn(tableId)
  if (!turn || !(await getTable(tableId))?.turnTimerEnabled) return
  if (humanTurn(tableId) !== turn) return
  stopTurnTimer(tableId)
  setTurnDeadline(tableId, Date.now() + TURN_TIME)
  sendViews(tableId)
  turnTimers.set(tableId, setTimeout(() => {
    const game = timeOut(tableId, turn)
    if (game) sendGame(game)
  }, TURN_TIME))
}

export function againController(req: Request, res: Response): void {
  const tableId = voteToPlayAgain(String(req.params.gameId), res.locals.userId)
  if (!tableId) {
    res.status(409).json({ error: "No vote to join" })
    return
  }
  sendViews(tableId)
  dealIfVoted(tableId).catch(console.error)
  res.status(204).end()
}

export function playBotLater(tableId: string) {
  if (waitingBots.has(tableId) || !isBotTurn(tableId)) return
  waitingBots.add(tableId)
  setTimeout(() => {
    waitingBots.delete(tableId)
    const game = playBot(tableId)
    if (game) sendGame(game)
  }, BOT_MIN_DELAY + Math.random() * (BOT_MAX_DELAY - BOT_MIN_DELAY))
}

async function dealNextHand(tableId: string) {
  await nextHand(tableId)
  sendViews(tableId)
  playBotLater(tableId)
  await startTurnTimer(tableId)
}

const ACTION_TYPES: ActionType[] = ["fold", "check", "call", "bet", "raise"]

const ACT_ERROR_STATUS: Record<ActError, number> = {
  "game-not-found": 404,
  "unknown-player": 404,
  "not-your-turn": 409,
  "wrong-phase": 409,
  "illegal-action": 400,
}

export function actionController(req: Request, res: Response): void {
  const playerId: string = res.locals.userId
  const type: unknown = req.body?.action?.type
  const amount: unknown = req.body?.action?.amount
  const validAmount = amount === undefined || typeof amount === "number"
  if (!ACTION_TYPES.includes(type as ActionType) || !validAmount) {
    res.status(400).json({ error: "invalid-action" })
    return
  }

  const action: PlayerAction = amount === undefined ? { type: type as ActionType } : { type: type as ActionType, amount }
  const result = takeAction(String(req.params.gameId), playerId, action)
  if (!result.ok) {
    res.status(ACT_ERROR_STATUS[result.error]).json({ error: result.error })
    return
  }
  sendGame(result.value)
  res.status(204).end()
}

const DRAW_ERROR_STATUS: Record<DrawCardsError, number> = {
  "game-not-found": 404,
  "not-your-turn": 409,
  "wrong-phase": 409,
}

function isDiscardList(discard: unknown): discard is number[] {
  return Array.isArray(discard)
    && discard.every(i => Number.isInteger(i) && i >= 0 && i <= 4)
    && new Set(discard).size === discard.length
}

export function drawController(req: Request, res: Response): void {
  const playerId: string = res.locals.userId
  const discard: unknown = req.body?.discard
  if (!isDiscardList(discard)) {
    res.status(400).json({ error: "invalid-draw" })
    return
  }

  const result = drawCards(String(req.params.gameId), playerId, discard)
  if (!result.ok) {
    res.status(DRAW_ERROR_STATUS[result.error]).json({ error: result.error })
    return
  }
  sendGame(result.value)
  res.status(204).end()
}
