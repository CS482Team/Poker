import { announceBalance, fetchBalance, onBalanceChange } from "@/service/BalanceService"

describe("BalanceService", () => {
  it("fetches a balance", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ balance: 1200 }) })
    expect(await fetchBalance("u1")).toBe(1200)
  })

  it("throws when the balance can't load", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    await expect(fetchBalance("u1")).rejects.toThrow("Could not load balance")
  })

  it("tells listeners about a new balance until they stop listening", () => {
    const listener = jest.fn()
    const stop = onBalanceChange(listener)
    announceBalance(850)
    expect(listener).toHaveBeenCalledWith(850)

    stop()
    announceBalance(700)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
