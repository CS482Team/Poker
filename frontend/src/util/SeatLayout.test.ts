import { OPEN_SPOTS, SPOT_POSITION, spotForSeat } from "./SeatLayout"

describe("spotForSeat", () => {
  it("puts you (seat 0) at the bottom", () => {
    expect(spotForSeat(0)).toBe("bottom")
  })

  it("gives each of the 4 seats a different spot", () => {
    const spots = [0, 1, 2, 3].map(spotForSeat)
    expect(new Set(spots).size).toBe(4)
  })

  it("never seats a player in an open spot", () => {
    for (const seat of [0, 1, 2, 3]) expect(OPEN_SPOTS).not.toContain(spotForSeat(seat))
  })

  it("has a position on the table for every spot it uses", () => {
    for (const seat of [0, 1, 2, 3]) expect(SPOT_POSITION[spotForSeat(seat)]).toBeDefined()
  })
})
