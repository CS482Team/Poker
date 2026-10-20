export const mockState: { result: object; awaited?: object } = { result: {} }
export const calls: [string, unknown[]][] = []
export const failure = { error: new Error("db down") }

const mockQuery: Record<string, unknown> = {
  single: () => Promise.resolve(mockState.result),
  maybeSingle: () => Promise.resolve(mockState.result),
  then: (resolve: (value: object) => void) => resolve(mockState.awaited ?? mockState.result),
}
for (const name of ["select", "insert", "update", "delete", "eq", "order"]) {
  mockQuery[name] = (...args: unknown[]) => {
    calls.push([name, args])
    return mockQuery
  }
}

export const supabaseMock = {
  createClient: () => ({
    from: (table: string) => {
      calls.push(["from", [table]])
      return mockQuery
    },
  }),
}

export function resetMock() {
  calls.length = 0
  mockState.result = {}
  mockState.awaited = undefined
}
