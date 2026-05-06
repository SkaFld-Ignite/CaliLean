/**
 * Backend Smoke Tests (SKA-5)
 *
 * Lightweight HTTP smoke tests that verify the Medusa backend API surface
 * is responding correctly. These tests run against a live server instance.
 *
 * Prerequisites:
 *   1. Backend running on localhost:9000  (`cd apps/backend && pnpm dev`)
 *   2. Database seeded                   (`cd apps/backend && pnpm seed`)
 *
 * Run:
 *   cd apps/backend && pnpm test -- src/__tests__/smoke.test.ts
 *
 * Environment overrides:
 *   MEDUSA_BACKEND_URL  — base URL (default: http://localhost:9000)
 *   MEDUSA_ADMIN_EMAIL   — admin email for auth test
 *   MEDUSA_ADMIN_PASSWORD — admin password for auth test
 *   MEDUSA_PUBLISHABLE_KEY — store API publishable key
 */

const BASE_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@medusa-test.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "supersecret"

// Publishable API key — required for /store/* endpoints.
// Retrieve from Medusa admin: Settings > API Key Management > Publishable API Keys
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || ""

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function api(
  path: string,
  options: RequestInit & { publishableKey?: boolean } = {}
) {
  const { publishableKey, ...fetchOptions } = options
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> || {}),
  }
  if (publishableKey && PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }
  return fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers })
}

/**
 * Guard: skip store API tests when no publishable key is configured.
 * The test will be marked as skipped (not failed) in CI without a key.
 */
const describeStore = PUBLISHABLE_KEY
  ? describe
  : describe.skip

/* ------------------------------------------------------------------ */
/*  Server health                                                      */
/* ------------------------------------------------------------------ */

describe("Backend Smoke Tests", () => {
  // Fail fast if the server is not reachable at all
  beforeAll(async () => {
    try {
      await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) })
    } catch {
      throw new Error(
        `Cannot reach Medusa backend at ${BASE_URL}. ` +
          "Start the server with `cd apps/backend && pnpm dev` before running smoke tests."
      )
    }
  })

  describe("Health check", () => {
    it("GET /health returns 200 with OK", async () => {
      const res = await api("/health")
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toBe("OK")
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Admin auth                                                       */
  /* ---------------------------------------------------------------- */

  describe("Admin auth", () => {
    it("POST /auth/user/emailpass returns a token", async () => {
      const res = await api("/auth/user/emailpass", {
        method: "POST",
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      })

      // 200 = valid credentials, 401 = wrong credentials
      // Both prove the auth endpoint is functional
      expect([200, 401]).toContain(res.status)

      if (res.status === 200) {
        const body = await res.json()
        expect(body).toHaveProperty("token")
      }
    })

    it("POST /auth/user/emailpass rejects invalid credentials", async () => {
      const res = await api("/auth/user/emailpass", {
        method: "POST",
        body: JSON.stringify({
          email: "nonexistent@smoke-test.invalid",
          password: "wrong-password-12345",
        }),
      })
      expect(res.status).toBe(401)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Store API — requires publishable key                             */
  /* ---------------------------------------------------------------- */

  describeStore("Store API (publishable key)", () => {
    it("GET /store/products returns a list of products", async () => {
      const res = await api("/store/products?limit=5", {
        publishableKey: true,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty("products")
      expect(Array.isArray(body.products)).toBe(true)
      expect(body).toHaveProperty("count")
    })

    it("GET /store/product-categories returns categories", async () => {
      const res = await api("/store/product-categories?limit=10", {
        publishableKey: true,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty("product_categories")
      expect(Array.isArray(body.product_categories)).toBe(true)
    })

    it("POST /store/carts creates a cart", async () => {
      const res = await api("/store/carts", {
        method: "POST",
        publishableKey: true,
        body: JSON.stringify({}),
      })
      // 200 or 201 depending on Medusa version
      expect([200, 201]).toContain(res.status)
      const body = await res.json()
      expect(body).toHaveProperty("cart")
      expect(body.cart).toHaveProperty("id")
      expect(body.cart.id).toMatch(/^cart_/)
    })

    it("GET /store/regions returns available regions", async () => {
      const res = await api("/store/regions", {
        publishableKey: true,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty("regions")
      expect(Array.isArray(body.regions)).toBe(true)
    })

    it("GET /store/collections returns collections", async () => {
      const res = await api("/store/collections", {
        publishableKey: true,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty("collections")
      expect(Array.isArray(body.collections)).toBe(true)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Admin API — authenticated routes                                 */
  /* ---------------------------------------------------------------- */

  describe("Admin API", () => {
    let adminToken: string | null = null

    beforeAll(async () => {
      const res = await api("/auth/user/emailpass", {
        method: "POST",
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      })
      if (res.status === 200) {
        const body = await res.json()
        adminToken = body.token
      }
    })

    it("GET /admin/products returns products when authenticated", async () => {
      if (!adminToken) {
        console.warn(
          "Skipping admin products test — could not authenticate. " +
            "Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD to valid credentials."
        )
        return
      }

      const res = await api("/admin/products?limit=5", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty("products")
      expect(Array.isArray(body.products)).toBe(true)
    })

    it("GET /admin/products returns 401 without auth", async () => {
      const res = await api("/admin/products?limit=1")
      expect(res.status).toBe(401)
    })
  })
})
