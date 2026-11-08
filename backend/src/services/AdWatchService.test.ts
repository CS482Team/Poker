import { finishWatch, startWatch } from "./AdWatchService"

let now = 0

beforeEach(() => {
  now = 0
  jest.spyOn(Date, "now").mockImplementation(() => now)
})

describe("AdWatchService", () => {
  it("finishes after ten seconds, only once", () => {
    startWatch("u1", "a1")
    now = 10000
    expect(finishWatch("u1", "a1")).toBe(true)
    expect(finishWatch("u1", "a1")).toBe(false)
  })

  it("rejects finishing early", () => {
    startWatch("u1", "a1")
    now = 9999
    expect(finishWatch("u1", "a1")).toBe(false)
  })

  it("rejects a different ad or no watch", () => {
    startWatch("u1", "a1")
    now = 10000
    expect(finishWatch("u1", "a2")).toBe(false)
    expect(finishWatch("u2", "a1")).toBe(false)
  })
})
