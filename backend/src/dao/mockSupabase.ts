process.env.SUPABASE_URL = "http://localhost"
process.env.SUPABASE_SERVICE_KEY = "test"

export const mockState: { result: object; awaited?: object } = { result: {} }
export const calls: [string, unknown[]][] = []
export const failure = { error: new Error("db down") }

const mockQuery: Record<string, unknown> = {
  single: () => Promise.resolve(mockState.result),
  maybeSingle: () => Promise.resolve(mockState.result),
  then: (resolve: (value: object) => void) => resolve(mockState.awaited ?? mockState.result),
}
for (const name of ["select", "insert", "upsert", "update", "delete", "eq", "neq", "or", "ilike", "in", "lte", "order", "limit", "gt", "is"]) {
  mockQuery[name] = (...args: unknown[]) => {
    calls.push([name, args])
    return mockQuery
  }
}

export const supabaseMock = {
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve(mockState.result),
      admin: {
        updateUserById: (...args: unknown[]) => {
          calls.push(["updateUserById", args])
          return Promise.resolve(mockState.result)
        },
      },
    },
    from: (table: string) => {
      calls.push(["from", [table]])
      return mockQuery
    },
    // database functions, e.g. rpc("purchase_item", { p_user, p_item })
    rpc: (fn: string, args: object) => {
      calls.push(["rpc", [fn, args]])
      return Promise.resolve(mockState.result)
    },
  }),
}

export function resetMock() {
  calls.length = 0
  mockState.result = {}
  delete mockState.awaited
}
