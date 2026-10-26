/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts", "!src/**/*.test.ts"],
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
};
