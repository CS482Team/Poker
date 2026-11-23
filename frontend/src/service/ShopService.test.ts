import { announceLoadout, buyItem, equipItem, fetchInventory, fetchLoadout, fetchShopItems, onLoadoutChange, ShopRequestError, unequipSlot } from "@/service/ShopService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(status: number, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body })
}

describe("ShopService", () => {
  it("loads the catalog, sending the session so owned items are marked", async () => {
    respond(200, [{ id: "i1" }])
    expect(await fetchShopItems()).toEqual([{ id: "i1" }])
    const [url, init] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toMatch(/\/shop\/items$/)
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer token" })
  })

  it("throws when the catalog can't load", async () => {
    respond(500)
    await expect(fetchShopItems()).rejects.toThrow("500")
  })

  it("buys an item and returns the new balance", async () => {
    respond(200, { balance: 850 })
    expect(await buyItem("i1")).toBe(850)
    const [url, init] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toMatch(/\/shop\/items\/i1\/purchase$/)
    expect((init as RequestInit).method).toBe("POST")
  })

  it("passes on the server's reason when a purchase is refused", async () => {
    respond(402, { error: "You don't have enough chips.", code: "insufficient_funds" })
    const error = await buyItem("i1").catch((e) => e)
    expect(error).toBeInstanceOf(ShopRequestError)
    expect(error.message).toBe("You don't have enough chips.")
    expect(error.code).toBe("insufficient_funds")
  })

  it("asks signed out players to sign in", async () => {
    respond(401, { error: "Not signed in" })
    await expect(buyItem("i1")).rejects.toThrow("Sign in to buy items")
  })

  it("gives a general message when the server says nothing useful", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error("not json") } })
    await expect(buyItem("i1")).rejects.toThrow("Purchase failed (500)")
  })
})

describe("inventory and loadout", () => {
  it("loads what you own and what you have on", async () => {
    respond(200, [{ id: "i1" }])
    expect(await fetchInventory()).toEqual([{ id: "i1" }])
    expect(jest.mocked(global.fetch).mock.calls[0]![0]).toMatch(/\/shop\/inventory$/)

    respond(200, { avatar: { id: "i1" } })
    expect(await fetchLoadout()).toEqual({ avatar: { id: "i1" } })
    expect(jest.mocked(global.fetch).mock.calls[0]![0]).toMatch(/\/shop\/loadout$/)
  })

  it("equips an item and returns the updated loadout", async () => {
    respond(200, { emote_2: { id: "i1" } })
    expect(await equipItem("emote_2", "i1")).toEqual({ emote_2: { id: "i1" } })
    const [url, init] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toMatch(/\/shop\/loadout\/emote_2$/)
    expect((init as RequestInit).method).toBe("PUT")
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ itemId: "i1" })
  })

  it("empties a slot and returns the updated loadout", async () => {
    respond(200, {})
    expect(await unequipSlot("card_back")).toEqual({})
    const [url, init] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toMatch(/\/shop\/loadout\/card_back$/)
    expect((init as RequestInit).method).toBe("DELETE")
  })

  it("asks signed out players to sign in", async () => {
    respond(401)
    await expect(fetchInventory()).rejects.toThrow("Sign in to see your items")
    await expect(fetchLoadout()).rejects.toThrow("Sign in to see your items")
  })

  it("passes on the server's reason when equipping is refused", async () => {
    respond(403, { error: "You don't own that item.", code: "not_owned" })
    const error = await equipItem("avatar", "i1").catch((e) => e)
    expect(error.message).toBe("You don't own that item.")
    expect(error.code).toBe("not_owned")
    respond(500)
    await expect(unequipSlot("avatar")).rejects.toThrow("Couldn't update your loadout (500)")
  })
})

describe("loadout changes", () => {
  it("tells listeners about a new loadout until they stop listening", () => {
    const listener = jest.fn()
    const stop = onLoadoutChange(listener)
    announceLoadout({})
    expect(listener).toHaveBeenCalledWith({})
    stop()
    announceLoadout({})
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
