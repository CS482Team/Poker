import { OPEN_SPOTS, SPOT_POSITION, spotForSeat } from "./SeatLayout"

describe("spotForSeat", () => {
  it("puts you (seat 0) at the bottom", () => {
    expect(spotForSeat(0)).toBe("bottom")
  })

  it("gives each of the 4 seats a different spot", () => {
    const spots = [0, 1, 2, 3].map(seat => spotForSeat(seat))
    expect(new Set(spots).size).toBe(4)
  })

  it("never seats a player in an open spot", () => {
    for (const seat of [0, 1, 2, 3]) expect(OPEN_SPOTS).not.toContain(spotForSeat(seat))
  })

  it("has a position on the table for every spot it uses", () => {
    for (const seat of [0, 1, 2, 3]) expect(SPOT_POSITION[spotForSeat(seat)]).toBeDefined()
  })
})

describe("spotForSeat from another player's point of view", () => {
  it("puts the viewer at the bottom, whichever seat they're in", () => {
    expect(spotForSeat(2, 2)).toBe("bottom")
  })

  it("keeps the others in table order going round from the viewer", () => {
    expect([3, 0, 1].map(seat => spotForSeat(seat, 2))).toEqual(["topLeft", "topRight", "right"])
  })
})
