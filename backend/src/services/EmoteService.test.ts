import { getLoadout } from "../dao/ShopDAO"
import { isSeated } from "../dao/TablePlayersDAO"
import { EmoteError, playEmote } from "./EmoteService"

jest.mock("../dao/ShopDAO", () => ({ getLoadout: jest.fn() }))
jest.mock("../dao/TablePlayersDAO", () => ({ isSeated: jest.fn() }))

const laugh = { id: "e1", name: "Big Laugh", description: "", type: "emote" as const, rarity: "rare" as const, cost: 500, assetUrl: null, style: { text: "😂" } }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(isSeated).mockResolvedValue(true)
  jest.mocked(getLoadout).mockResolvedValue({ emote_2: laugh })
})

describe("playEmote", () => {
  it("plays the emote in that wheel slot for a seated player", async () => {
    expect(await playEmote("t1", "u1", "emote_2")).toEqual({ tableId: "t1", userId: "u1", emote: laugh })
    expect(isSeated).toHaveBeenCalledWith("t1", "u1")
  })

  it("only lets seated players emote", async () => {
    jest.mocked(isSeated).mockResolvedValue(false)
    await expect(playEmote("t1", "u1", "emote_2")).rejects.toThrow(new EmoteError("Only seated players can use emotes"))
  })

  it("refuses an empty wheel slot", async () => {
    await expect(playEmote("t1", "u1", "emote_1")).rejects.toThrow(new EmoteError("That wheel slot is empty"))
  })

  it("refuses anything that isn't a wheel slot, before touching the database", async () => {
    await expect(playEmote("t1", "u1", "avatar" as never)).rejects.toThrow(EmoteError)
    expect(isSeated).not.toHaveBeenCalled()
  })
})
