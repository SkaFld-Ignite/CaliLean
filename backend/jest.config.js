/**
 * Jest config for backend unit tests.
 *
 * Scope: pure-logic modules under src/ (no Medusa runtime). Integration tests
 * that need a live container should use @medusajs/test-utils in a separate
 * config when we add them.
 */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  modulePaths: ["<rootDir>/src"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
            legacyDecorator: true,
          },
          target: "es2019",
        },
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/.medusa/", "/dist/"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/utils/**/*.ts",
    "!src/**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
}
