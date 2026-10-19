import { clearCurrentTableId, getCurrentTableId, setCurrentTableId } from "@/service/currentTableService"

beforeEach(() => {
  localStorage.clear()
})

describe("currentTableService", () => {
  it("returns null when no table is stored", () => {
    expect(getCurrentTableId()).toBeNull()
  })

  it("stores and returns the current table id", () => {
    setCurrentTableId("t1")
    expect(getCurrentTableId()).toBe("t1")
  })

  it("clears the current table id", () => {
    setCurrentTableId("t1")
    clearCurrentTableId()
    expect(getCurrentTableId()).toBeNull()
  })
})
