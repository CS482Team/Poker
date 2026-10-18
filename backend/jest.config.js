/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // Team rule (design doc 4.4): at least 80% coverage to merge into develop
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
}