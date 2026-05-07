import { CaliLeanConfigSchema } from "../src/schema/config"

describe("CaliLeanConfigSchema", () => {
  it("validates a minimal config", () => {
    const config = {
      store: { name: "Test", default_currency: "usd", supported_currencies: ["usd"] },
    }
    expect(CaliLeanConfigSchema.safeParse(config).success).toBe(true)
  })

  it("validates a full config with all resources", () => {
    const config = {
      store: { name: "CaliLean", default_currency: "usd", supported_currencies: ["usd", "eur"] },
      regions: [{ name: "US", currency_code: "usd", countries: ["us"], automatic_taxes: true }],
      categories: [{ name: "Peptides", handle: "peptides", children: [{ name: "Recovery", handle: "recovery" }] }],
      products: [{
        title: "BPC-157", handle: "bpc-157", status: "published", categories: ["recovery"],
        options: [{ title: "Size", values: ["5mg"] }],
        variants: [{ title: "5mg", sku: "CL-BPC-0005", options: { Size: "5mg" }, manage_inventory: false, prices: [{ currency_code: "usd", amount: 29.74 }] }],
      }],
      promotions: [{ code: "TEST", type: "standard", is_automatic: false, application_method: { type: "percentage", value: 10, allocation: "across", target_type: "items" } }],
      shipping: { profiles: [{ name: "Default", type: "default" }], options: [{ name: "Standard", region: "US", provider: "manual", price_type: "flat", amount: 0 }] },
      sales_channels: [{ name: "Default", products: "all" }],
      api_keys: [{ title: "Webshop", type: "publishable", sales_channels: ["Default"] }],
      inventory: { locations: [{ name: "Warehouse", address: { country_code: "us" } }] },
    }
    expect(CaliLeanConfigSchema.safeParse(config).success).toBe(true)
  })

  it("rejects invalid product status", () => {
    const config = {
      store: { name: "T", default_currency: "usd", supported_currencies: ["usd"] },
      products: [{ title: "X", handle: "x", status: "invalid", variants: [] }],
    }
    expect(CaliLeanConfigSchema.safeParse(config).success).toBe(false)
  })
})
