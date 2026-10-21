import { findOrCreateDemoTable } from "../../../src/dao/TableDao"
import { getSupabase } from "../../../src/config/Supabase"

jest.mock("../../../src/config/Supabase")

function fakeQuery(result: { data: unknown; error: unknown }) {
  const q: { [method: string]: jest.Mock } = {}
  for (const m of ["select", "insert", "update", "eq", "single", "maybeSingle"]) q[m] = jest.fn(() => q)
  q.then = jest.fn((resolve: (v: unknown) => void) => resolve(result))
  return q
}

const demoTable = { id: "t1", ante: 1, minimum_bet: 2 }

describe("findOrCreateDemoTable", () => {
  it("returns the existing demo table without creating one", async () => {
    const findQ = fakeQuery({ data: demoTable, error: null })
    const from = jest.fn(() => findQ)
    jest.mocked(getSupabase).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabase>)

    const table = await findOrCreateDemoTable()

    expect(findQ.eq).toHaveBeenCalledWith("name", "Demo Table")
    expect(findQ.insert).not.toHaveBeenCalled()
    expect(table).toEqual(demoTable)
  })

  it("creates the demo table when it doesn't exist", async () => {
    const findQ = fakeQuery({ data: null, error: null })
    const createQ = fakeQuery({ data: demoTable, error: null })
    const from = jest.fn().mockReturnValueOnce(findQ).mockReturnValueOnce(createQ)
    jest.mocked(getSupabase).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabase>)

    const table = await findOrCreateDemoTable()

    expect(createQ.insert).toHaveBeenCalledWith({ name: "Demo Table", buy_in: 100, ante: 1, minimum_bet: 2 })
    expect(table).toEqual(demoTable)
  })

  it("throws when the lookup fails", async () => {
    const from = jest.fn(() => fakeQuery({ data: null, error: new Error("boom") }))
    jest.mocked(getSupabase).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabase>)

    await expect(findOrCreateDemoTable()).rejects.toThrow("boom")
  })
})
