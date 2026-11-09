import { RateLimiter } from "../../src/socket/RateLimiter"

describe("RateLimiter", () => {
  let time = 0
  const limiter = new RateLimiter(2, 1000, () => time)

  beforeEach(() => {
    time = 0
    limiter.forget("a")
    limiter.forget("b")
  })

  it("allows up to the limit then blocks", () => {
    expect(limiter.allow("a")).toBe(true)
    expect(limiter.allow("a")).toBe(true)
    expect(limiter.allow("a")).toBe(false)
  })

  it("allows again once the window passes", () => {
    limiter.allow("a")
    limiter.allow("a")
    time = 1001
    expect(limiter.allow("a")).toBe(true)
  })

  it("counts each key on its own", () => {
    limiter.allow("a")
    limiter.allow("a")
    expect(limiter.allow("b")).toBe(true)
  })

  it("starts fresh after forgetting a key", () => {
    limiter.allow("a")
    limiter.allow("a")
    limiter.forget("a")
    expect(limiter.allow("a")).toBe(true)
  })
})