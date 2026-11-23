import request from "supertest"
import { app } from "../app"
import { getUserIdFromToken } from "../dao/UserDAO"
import { buyItem, equip, listInventory, listItems, loadoutOf, ShopError, unequip } from "../services/ShopService"

jest.mock("../dao/UserDAO", () => ({ getUserIdFromToken: jest.fn() }))
jest.mock("../services/ShopService", () => {
  const actual = jest.requireActual("../services/ShopService")
  return { ShopError: actual.ShopError, listItems: jest.fn(), buyItem: jest.fn(), listInventory: jest.fn(), loadoutOf: jest.fn(), equip: jest.fn(), unequip: jest.fn() }
})

const ITEM_ID = "3f1c2b4e-8a9d-4c1e-9b7a-2d5e6f708192"

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
  jest.mocked(listItems).mockResolvedValue([])
})

function signedIn(req: request.Test) {
  return req.set("Authorization", "Bearer token")
}

describe("GET /shop/items", () => {
  it("shows guests the catalog", async () => {
    const res = await request(app).get("/shop/items")
    expect(res.status).toBe(200)
    expect(listItems).toHaveBeenCalledWith(null)
  })

  it("marks ownership for a signed in player", async () => {
    await signedIn(request(app).get("/shop/items"))
    expect(listItems).toHaveBeenCalledWith("u1")
  })

  it("treats an expired token like a guest instead of failing", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue(null)
    const res = await signedIn(request(app).get("/shop/items"))
    expect(res.status).toBe(200)
    expect(listItems).toHaveBeenCalledWith(null)
  })
})

describe("POST /shop/items/:id/purchase", () => {
  it("needs a signed in player", async () => {
    const res = await request(app).post(`/shop/items/${ITEM_ID}/purchase`)
    expect(res.status).toBe(401)
    expect(buyItem).not.toHaveBeenCalled()
  })

  it("rejects an id that isn't a uuid before touching the database", async () => {
    const res = await signedIn(request(app).post("/shop/items/not-an-id/purchase"))
    expect(res.status).toBe(400)
    expect(buyItem).not.toHaveBeenCalled()
  })

  it("buys the item and returns the new balance", async () => {
    jest.mocked(buyItem).mockResolvedValue({ balance: 700 })
    const res = await signedIn(request(app).post(`/shop/items/${ITEM_ID}/purchase`))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ balance: 700 })
    expect(buyItem).toHaveBeenCalledWith("u1", ITEM_ID)
  })

  it.each([
    ["item_not_found", 404],
    ["user_not_found", 404],
    ["item_inactive", 409],
    ["already_owned", 409],
    ["insufficient_funds", 402],
  ] as const)("answers %s with %i and the code", async (code, status) => {
    jest.mocked(buyItem).mockRejectedValue(new ShopError(code))
    const res = await signedIn(request(app).post(`/shop/items/${ITEM_ID}/purchase`))
    expect(res.status).toBe(status)
    expect(res.body.code).toBe(code)
    expect(typeof res.body.error).toBe("string")
  })

  it("answers anything unexpected with a 500", async () => {
    jest.mocked(buyItem).mockRejectedValue(new Error("db down"))
    const res = await signedIn(request(app).post(`/shop/items/${ITEM_ID}/purchase`))
    expect(res.status).toBe(500)
  })
})

describe("GET /shop/inventory and /shop/loadout", () => {
  it("need a signed in player", async () => {
    expect((await request(app).get("/shop/inventory")).status).toBe(401)
    expect((await request(app).get("/shop/loadout")).status).toBe(401)
  })

  it("return the player's items and loadout", async () => {
    jest.mocked(listInventory).mockResolvedValue([])
    jest.mocked(loadoutOf).mockResolvedValue({})
    expect((await signedIn(request(app).get("/shop/inventory"))).body).toEqual([])
    expect((await signedIn(request(app).get("/shop/loadout"))).body).toEqual({})
    expect(listInventory).toHaveBeenCalledWith("u1")
    expect(loadoutOf).toHaveBeenCalledWith("u1")
  })
})

describe("PUT /shop/loadout/:slot", () => {
  it("needs a signed in player", async () => {
    const res = await request(app).put("/shop/loadout/avatar").send({ itemId: ITEM_ID })
    expect(res.status).toBe(401)
  })

  it("equips the item and answers with the new loadout", async () => {
    jest.mocked(loadoutOf).mockResolvedValue({})
    const res = await signedIn(request(app).put("/shop/loadout/emote_2")).send({ itemId: ITEM_ID })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({})
    expect(equip).toHaveBeenCalledWith("u1", ITEM_ID, "emote_2")
  })

  it("rejects a slot that doesn't exist", async () => {
    const res = await signedIn(request(app).put("/shop/loadout/emote_9")).send({ itemId: ITEM_ID })
    expect(res.status).toBe(400)
    expect(equip).not.toHaveBeenCalled()
  })

  it("rejects a missing or malformed item id", async () => {
    expect((await signedIn(request(app).put("/shop/loadout/avatar")).send({})).status).toBe(400)
    expect((await signedIn(request(app).put("/shop/loadout/avatar")).send({ itemId: "nope" })).status).toBe(400)
    expect(equip).not.toHaveBeenCalled()
  })

  it.each([
    ["item_not_found", 404],
    ["wrong_slot", 400],
    ["not_owned", 403],
  ] as const)("answers %s with %i and the code", async (code, status) => {
    jest.mocked(equip).mockRejectedValue(new ShopError(code))
    const res = await signedIn(request(app).put("/shop/loadout/avatar")).send({ itemId: ITEM_ID })
    expect(res.status).toBe(status)
    expect(res.body.code).toBe(code)
  })

  it("answers anything unexpected with a 500", async () => {
    jest.mocked(equip).mockRejectedValue(new Error("db down"))
    const res = await signedIn(request(app).put("/shop/loadout/avatar")).send({ itemId: ITEM_ID })
    expect(res.status).toBe(500)
  })
})

describe("DELETE /shop/loadout/:slot", () => {
  it("needs a signed in player", async () => {
    expect((await request(app).delete("/shop/loadout/avatar")).status).toBe(401)
  })

  it("empties the slot and answers with the new loadout", async () => {
    jest.mocked(loadoutOf).mockResolvedValue({})
    const res = await signedIn(request(app).delete("/shop/loadout/card_back"))
    expect(res.status).toBe(200)
    expect(unequip).toHaveBeenCalledWith("u1", "card_back")
  })

  it("rejects a slot that doesn't exist", async () => {
    expect((await signedIn(request(app).delete("/shop/loadout/hat"))).status).toBe(400)
    expect(unequip).not.toHaveBeenCalled()
  })
})
