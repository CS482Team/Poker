const nextJest = require("next/jest")
const createJestConfig = nextJest({ dir: "./" })
module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  // Team rule (design doc 4.4): at least 80% coverage to merge into develop
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
})