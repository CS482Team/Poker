import type { GameState } from "../game/GameState"

// Keeps live games in memory between requests, keyed by GameState.id
// (no database: match rows are saved separately through the DAOs)
export interface GameStore {
  save(game: GameState): void // add a game, or replace it with its newer state
  get(gameId: string): GameState | null // null when there's no such game
  delete(gameId: string): void
}

// A fresh, empty store (tests make their own so they never share games)
export function createGameStore(): GameStore {
  const games = new Map<string, GameState>()

  return {
    save(game) {
      games.set(game.id, game)
    },
    get(gameId) {
      return games.get(gameId) ?? null
    },
    delete(gameId) {
      games.delete(gameId)
    },
  }
}

// The one store the running server uses
export const gameStore = createGameStore()
