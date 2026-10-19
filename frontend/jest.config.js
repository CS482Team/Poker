const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  roots: ["<rootDir>/test"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/../shared/$1",
  },
  collectCoverageFrom: ["src/component/**/*.{ts,tsx}", "src/service/**/*.ts"],
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
})
