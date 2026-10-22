import type { GameState } from "../../../shared/GameState"

// Keeps live games in memory between requests, keyed by GameState.id
// (no database: match rows are saved separately through the DAOs)
// TODO persist games w/ db
export interface GameDAO {
  save(game: GameState): void // add a game, or replace it with its newer state
  get(gameId: string): GameState | null // null when there's no such game
  findByTable(tableId: string): GameState | null // the game running at a table, if any
  delete(gameId: string): void
}

// A fresh, empty store (tests make their own so they never share games)
export function createGameDAO(): GameDAO {
  const games = new Map<string, GameState>()

  return {
    save(game) {
      games.set(game.id, game)
    },
    get(gameId) {
      return games.get(gameId) ?? null
    },
    findByTable(tableId) {
      return [...games.values()].find(g => g.tableId === tableId) ?? null
    },
    delete(gameId) {
      games.delete(gameId)
    },
  }
}

// The one store the running server uses
export const gameDAO = createGameDAO()
