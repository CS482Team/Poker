import { configForTable, getPlayerView, startGame, StartGameError, takeAction } from "../../../src/services/Game"
import { gameStore } from "../../../src/services/GameStore"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../../../src/dao/MatchDao"
import type { SeatInput } from "../../../src/game/GameState"

jest.mock("../../../src/dao/MatchDao")

const table = { id: "t1", ante: 1, minimum_bet: 2 }
const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
  { id: "c", name: "Cara", stack: 100 },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(nextMatchNumber).mockResolvedValue(3)
  jest.mocked(insertMatch).mockResolvedValue("m1")
  jest.mocked(insertMatchPlayers).mockResolvedValue(undefined)
})

describe("configForTable", () => {
  it("uses the table's ante and minimum bet, with the big bet at double", () => {
    expect(configForTable(table)).toEqual({ ante: 1, smallBet: 2, bigBet: 4, maxBetsPerRound: 4 })
  })
})

describe("startGame", () => {
  it("keeps the dealt game in the store, ready for pre-draw betting", async () => {
    const { gameId } = await startGame(table, seats)

    const game = gameStore.get(gameId)
    expect(game?.phase).toBe("predraw-betting")
    expect(game?.pot).toBe(3)
    for (const p of game?.players ?? []) expect(p.hand).toHaveLength(5)
    gameStore.delete(gameId)
  })

  it("saves the match with the table's next match number", async () => {
    const { gameId, matchId } = await startGame(table, seats)

    expect(insertMatch).toHaveBeenCalledWith({ tableId: "t1", matchNumber: 3, pot: 3, dealerSeat: 0 })
    expect(insertMatchPlayers).toHaveBeenCalledWith("m1", [
      { seatNumber: 0, userId: null, botName: "Alice" },
      { seatNumber: 1, userId: null, botName: "Bob" },
      { seatNumber: 2, userId: null, botName: "Cara" },
    ])
    expect(matchId).toBe("m1")
    gameStore.delete(gameId)
  })

  it("refuses to start with fewer than 2 players, and saves nothing", async () => {
    await expect(startGame(table, seats.slice(0, 1))).rejects.toThrow(StartGameError)
    expect(insertMatch).not.toHaveBeenCalled()
  })

  it("refuses to deal when fewer than 2 players have chips", async () => {
    const broke = [{ id: "a", name: "Alice", stack: 100 }, { id: "b", name: "Bob", stack: 0 }]
    await expect(startGame(table, broke)).rejects.toMatchObject({ reason: "too-few-players" })
  })
})

describe("getPlayerView", () => {
  it("shows the player their own cards and only card counts for everyone else", async () => {
    const { gameId } = await startGame(table, seats)
    const game = gameStore.get(gameId)!

    const result = getPlayerView(gameId, "b")

    if (!result.ok) throw new Error(result.error)
    expect(result.value.you).toEqual({
      seat: 1,
      hand: game.players[1]!.hand,
      legalActions: [
        { type: "fold", amount: 0 },
        { type: "check", amount: 0 },
        { type: "bet", amount: 2 },
      ],
    })
    expect(result.value.players.map(p => p.cardCount)).toEqual([5, 5, 5])
    expect(JSON.stringify(result.value.players)).not.toContain("hand")
    expect(result.value).not.toHaveProperty("deck")
    expect(result.value.toActSeat).toBe(1)
    gameStore.delete(gameId)
  })

  it("reports a game that doesn't exist", () => {
    expect(getPlayerView("no-such-game", "a")).toEqual({ ok: false, error: "game-not-found" })
  })

  it("reports a player who isn't in the game", async () => {
    const { gameId } = await startGame(table, seats)
    expect(getPlayerView(gameId, "stranger")).toEqual({ ok: false, error: "player-not-in-game" })
    gameStore.delete(gameId)
  })
})

describe("takeAction", () => {
  it("applies the action to the stored game and returns the player's updated view", async () => {
    const { gameId } = await startGame(table, seats)

    const result = takeAction(gameId, "b", { type: "bet" })

    if (!result.ok) throw new Error(result.error)
    expect(result.value.pot).toBe(5)
    expect(result.value.toActSeat).toBe(2)
    expect(gameStore.get(gameId)?.pot).toBe(5) // saved, so the next request sees it
    gameStore.delete(gameId)
  })

  it("shows legal actions only to the player whose turn it is", async () => {
    const { gameId } = await startGame(table, seats)

    const bob = getPlayerView(gameId, "b")
    const cara = getPlayerView(gameId, "c")

    if (!bob.ok || !cara.ok) throw new Error("view failed")
    expect(bob.value.you.legalActions.map(a => a.type)).toEqual(["fold", "check", "bet"])
    expect(cara.value.you.legalActions).toEqual([])
    gameStore.delete(gameId)
  })

  it("leaves the stored game unchanged when the action is refused", async () => {
    const { gameId } = await startGame(table, seats)

    expect(takeAction(gameId, "c", { type: "check" })).toEqual({ ok: false, error: "not-your-turn" })
    expect(gameStore.get(gameId)?.toActIndex).toBe(1)
    gameStore.delete(gameId)
  })

  it("reports a game that doesn't exist", () => {
    expect(takeAction("no-such-game", "b", { type: "check" })).toEqual({ ok: false, error: "game-not-found" })
  })
})
