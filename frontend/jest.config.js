const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  roots: ["<rootDir>/src"],
  // Same as the "@/*" alias in tsconfig.json: "@/x" means "src/x"
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/app/layout.tsx"],
  // Team rule (design doc 4.4): at least 80% coverage to merge into develop
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
})
