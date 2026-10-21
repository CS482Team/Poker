/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
  // Team rule (design doc 4.4): at least 80% coverage to merge into develop
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
};
