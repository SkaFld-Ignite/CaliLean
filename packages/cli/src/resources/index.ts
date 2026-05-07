// ── Resource Registry ─────────────────────────────────────────────────────
// Ordered list of resources for orchestrated sync.
// Dependencies flow top-to-bottom: later resources may reference earlier ones.

export const RESOURCE_ORDER = [
  "store",
  "regions",
  "categories",
  "shipping",
  "tax",
  "products",
  "sales-channels",
  "api-keys",
  "promotions",
  "inventory",
] as const

export type ResourceName = (typeof RESOURCE_ORDER)[number]

// ── Re-exports ────────────────────────────────────────────────────────────

export { dumpStore, syncStore } from "./store"
export { regionsHandler } from "./regions"
export { dumpCategories, syncCategories } from "./categories"
export { dumpShipping, syncShipping } from "./shipping"
export { dumpTax, syncTax } from "./tax"
export { dumpProducts, syncProducts } from "./products"
export { dumpSalesChannels, syncSalesChannels } from "./sales-channels"
export { dumpApiKeys, syncApiKeys } from "./api-keys"
export { dumpPromotions, syncPromotions } from "./promotions"
export { dumpInventory, syncInventory } from "./inventory"
