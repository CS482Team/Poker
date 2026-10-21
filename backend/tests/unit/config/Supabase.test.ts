// Fake Supabase library: createClient returns a plain object we can compare
jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn(() => ({})) }))

const ORIGINAL_ENV = process.env

// Load a fresh copy of Supabase.ts, so the cached client from a previous test is gone
function loadConfig(): typeof import("../../../src/config/Supabase") {
  return require("../../../src/config/Supabase")
}

beforeEach(() => {
  jest.resetModules()
  process.env = { ...ORIGINAL_ENV }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe("getSupabase", () => {
  it("throws a helpful error when the URL is missing", () => {
    delete process.env.SUPABASE_URL
    process.env.SUPABASE_SERVICE_KEY = "key"
    expect(() => loadConfig().getSupabase()).toThrow("must be set in backend/.env")
  })

  it("throws a helpful error when the service key is missing", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co"
    delete process.env.SUPABASE_SERVICE_KEY
    expect(() => loadConfig().getSupabase()).toThrow("must be set in backend/.env")
  })

  it("creates the client once and reuses it", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co"
    process.env.SUPABASE_SERVICE_KEY = "key"
    const { getSupabase } = loadConfig()

    expect(getSupabase()).toBe(getSupabase())
    expect(require("@supabase/supabase-js").createClient).toHaveBeenCalledTimes(1)
  })
})
