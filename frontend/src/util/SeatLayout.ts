// Named spots around the oval table
export type Spot = "bottom" | "left" | "topLeft" | "topRight" | "right"

// Where each spot sits, as a % of the table's box (the seat is centred on this point)
export const SPOT_POSITION: Record<Spot, { top: string; left: string }> = {
  bottom: { top: "86%", left: "50%" },
  left: { top: "46%", left: "4%" },
  topLeft: { top: "6%", left: "30%" },
  topRight: { top: "6%", left: "70%" },
  right: { top: "46%", left: "96%" },
}

// Spot for each seat at a 4-player table, matching the Figma mock (seat 0 = you)
const FOUR_PLAYER_SPOTS: Spot[] = ["bottom", "topLeft", "topRight", "right"]

// Spots with nobody in them at a 4-player table
export const OPEN_SPOTS: Spot[] = ["left"]

export function spotForSeat(seat: number): Spot {
  return FOUR_PLAYER_SPOTS[seat] ?? "left"
}
