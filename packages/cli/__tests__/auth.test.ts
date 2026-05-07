import { resolveAuth } from "../src/auth/resolve"

// Suppress chalk output in tests
jest.mock("../src/utils/logger", () => ({
  log: { dim: jest.fn(), warn: jest.fn() },
}))

describe("resolveAuth", () => {
  const originalEnv = process.env

  beforeEach(() => { process.env = { ...originalEnv } })
  afterAll(() => { process.env = originalEnv })

  it("uses explicit flags when provided", async () => {
    const creds = await resolveAuth({ url: "https://explicit.example.com", email: "explicit@test.com", password: "explicitpw" })
    expect(creds).toEqual({ url: "https://explicit.example.com", email: "explicit@test.com", password: "explicitpw" })
  })

  it("falls back to env vars when no flags", async () => {
    process.env.MEDUSA_BACKEND_URL = "https://env.example.com"
    process.env.MEDUSA_ADMIN_EMAIL = "env@test.com"
    process.env.MEDUSA_ADMIN_PASSWORD = "envpw"
    const creds = await resolveAuth({})
    expect(creds).toEqual({ url: "https://env.example.com", email: "env@test.com", password: "envpw" })
  })

  it("uses defaults when nothing else available", async () => {
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.MEDUSA_ADMIN_EMAIL
    delete process.env.MEDUSA_ADMIN_PASSWORD
    const creds = await resolveAuth({})
    expect(creds).toEqual({ url: "http://localhost:9000", email: "admin@calilean.com", password: "supersecret" })
  })
})
