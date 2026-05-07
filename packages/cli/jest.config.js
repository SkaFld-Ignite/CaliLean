module.exports = {
  transform: { "^.+\\.tsx?$": ["@swc/jest"] },
  testMatch: ["**/__tests__/**/*.test.ts"],
  testTimeout: 10000,
}
