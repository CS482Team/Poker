export type ActionType = "fold" | "check" | "call" | "bet" | "raise"

export interface PlayerAction {
  type: ActionType
  amount?: number
}

export type LegalAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call"; amount: number }
  | { type: "bet" | "raise"; min: number; max: number }
