import { dealDemo } from "../../../src/services/Demo"
import { findOrCreateDemoTable } from "../../../src/dao/TableDao"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../../../src/dao/MatchDao"

jest.mock("../../../src/dao/TableDao")
jest.mock("../../../src/dao/MatchDao")

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(findOrCreateDemoTable).mockResolvedValue({ id: "t1", ante: 1, minimum_bet: 2 })
  jest.mocked(nextMatchNumber).mockResolvedValue(5)
  jest.mocked(insertMatch).mockResolvedValue("m1")
  jest.mocked(insertMatchPlayers).mockResolvedValue(undefined)
})

describe("dealDemo", () => {
  it("deals 5 cards to each of the 4 demo players", async () => {
    const deal = await dealDemo()
    expect(deal.players).toHaveLength(4)
    for (const p of deal.players) expect(p.hand).toHaveLength(5)
  })

  it("collects the table's ante from every player into the pot", async () => {
    const deal = await dealDemo()
    expect(deal.pot).toBe(4)
    for (const p of deal.players) expect(p.stack).toBe(99)
  })

  it("saves the match with the table, pot and dealer seat", async () => {
    await dealDemo()
    expect(insertMatch).toHaveBeenCalledWith({ tableId: "t1", matchNumber: 5, pot: 4, dealerSeat: 0 })
  })

  it("saves every demo player as a bot", async () => {
    await dealDemo()
    expect(insertMatchPlayers).toHaveBeenCalledWith("m1", [
      { seatNumber: 0, userId: null, botName: "Alice" },
      { seatNumber: 1, userId: null, botName: "Bob" },
      { seatNumber: 2, userId: null, botName: "Cara" },
      { seatNumber: 3, userId: null, botName: "Dan" },
    ])
  })

  it("returns the saved match id", async () => {
    const deal = await dealDemo()
    expect(deal.matchId).toBe("m1")
  })

  it("returns whose turn it is: the first player left of the dealer", async () => {
    const deal = await dealDemo()
    expect(deal.dealerSeat).toBe(0)
    expect(deal.toActSeat).toBe(1)
  })
})
