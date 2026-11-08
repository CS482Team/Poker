import { createAd, deleteAd, editAd, getActiveAds, getAd, getAllAds, setAdActive } from "../dao/AdDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const newAd = { title: "Bonus", rewardAmount: 500 }

beforeEach(resetMock)

describe("AdDAO", () => {
  it("lists ads", async () => {
    mockState.result = { data: [{ id: "a1", title: "Bonus", reward_amount: 500, active: true }] }
    expect(await getAllAds()).toEqual([{ id: "a1", title: "Bonus", rewardAmount: 500, active: true }])
  })

  it("lists only active ads", async () => {
    mockState.awaited = { data: [{ id: "a1", title: "Bonus", reward_amount: 500, active: true }] }
    expect(await getActiveAds()).toHaveLength(1)
    expect(calls).toContainEqual(["eq", ["active", true]])
  })

  it("gets one ad", async () => {
    mockState.result = { data: { id: "a1", title: "Bonus", reward_amount: 500, active: true } }
    expect((await getAd("a1"))?.title).toBe("Bonus")
    mockState.result = { data: null }
    expect(await getAd("missing")).toBeNull()
  })

  it("creates an inactive ad", async () => {
    mockState.result = { data: { id: "a1" } }
    expect(await createAd(newAd, "u1")).toBe("a1")
    expect(calls).toContainEqual(["insert", [{ title: "Bonus", reward_amount: 500, active: false, created_by: "u1" }]])
  })

  it("edits an ad", async () => {
    await editAd("a1", newAd)
    expect(calls).toContainEqual(["update", [{ title: "Bonus", reward_amount: 500 }]])
    expect(calls).toContainEqual(["eq", ["id", "a1"]])
  })

  it("sets an ad active", async () => {
    await setAdActive("a1", true)
    expect(calls).toContainEqual(["update", [{ active: true }]])
    expect(calls).toContainEqual(["eq", ["id", "a1"]])
  })

  it("deletes an ad", async () => {
    await deleteAd("a1")
    expect(calls).toContainEqual(["from", ["advert"]])
    expect(calls).toContainEqual(["eq", ["id", "a1"]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getAllAds()).rejects.toThrow("db down")
    await expect(getActiveAds()).rejects.toThrow("db down")
    await expect(getAd("a1")).rejects.toThrow("db down")
    await expect(createAd(newAd, "u1")).rejects.toThrow("db down")
    await expect(editAd("a1", newAd)).rejects.toThrow("db down")
    await expect(setAdActive("a1", true)).rejects.toThrow("db down")
    await expect(deleteAd("a1")).rejects.toThrow("db down")
  })
})
