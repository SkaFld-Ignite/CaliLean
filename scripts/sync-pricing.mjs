#!/usr/bin/env node
// Sync CaliLean catalog + per-variant pricing + tier rows to a Medusa instance.
//
// Reads source of truth: apps/storefront/src/data/products-seed.json
// Operates on: Medusa Admin API (Railway production by default)
//
// What it does, in order:
//   1. Auth.
//   2. Resolve sales channel + region (USD).
//   3. For each seed product:
//        - Find existing product by handle.
//        - If missing → create the whole product + visible variants + prices.
//        - If present → for each seed variant:
//              hidden → if it exists by SKU, delete it.
//              visible → match by SKU (or fall back to matching by size on
//              old SKU like CL-TES-0005). Update sku, price, and tier rows.
//              Missing variants are created.
//        - Variants on the product whose SKU isn't in the seed (and aren't a
//          tracked rename) are DELETED.
//   4. For every "live" variant we touched, rewrite the prices array as:
//        base + 4-5 (-10%) + 6-9 (-15%) + 10+ (-20%)
//
// Usage:
//   MEDUSA_BACKEND_URL=https://backend-production-3e14.up.railway.app \
//   MEDUSA_ADMIN_EMAIL=admin@yourmail.com \
//   MEDUSA_ADMIN_PASSWORD=... \
//   node scripts/sync-pricing.mjs [--dry-run]
//
// Falls back to apps/backend/.env if those vars aren't already set.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const DRY_RUN = process.argv.includes("--dry-run")

// ── env ────────────────────────────────────────────────────────────────────
function loadDotenv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    const [, k, raw] = m
    if (process.env[k]) continue
    let v = raw.trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    process.env[k] = v
  }
}
loadDotenv(path.join(repoRoot, "apps/backend/.env"))

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "https://backend-production-3e14.up.railway.app"
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || process.env.MEDUSA_ADMIN_PASS

if (!EMAIL || !PASSWORD) {
  console.error("FATAL: MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD required")
  process.exit(1)
}

// ── pricing rules ──────────────────────────────────────────────────────────
const TIERS = [
  { min: 4, max: 5, rate: 0.90 },
  { min: 6, max: 9, rate: 0.85 },
  { min: 10, max: null, rate: 0.80 },
]

function buildPrices(base) {
  const round = (n) => Math.round(n * 100) / 100
  const arr = [{ amount: base, currency_code: "usd" }]
  for (const t of TIERS) {
    const row = { amount: round(base * t.rate), currency_code: "usd", min_quantity: t.min }
    if (t.max != null) row.max_quantity = t.max
    arr.push(row)
  }
  return arr
}

// ── api client ─────────────────────────────────────────────────────────────
let token = null
async function api(method, path, body) {
  const url = `${BACKEND_URL}${path}`
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`)
  }
  return res.status === 204 ? null : res.json()
}

async function authenticate() {
  const url = `${BACKEND_URL}/auth/user/emailpass`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const json = await res.json()
  if (!json.token) throw new Error(`Auth response missing token: ${JSON.stringify(json)}`)
  token = json.token
}

async function fetchAllProducts() {
  const fields = "*variants,*variants.prices,*variants.options,*options,*options.values"
  const products = []
  let offset = 0
  const limit = 50
  while (true) {
    const res = await api("GET", `/admin/products?limit=${limit}&offset=${offset}&fields=${encodeURIComponent(fields)}`)
    products.push(...res.products)
    if (res.products.length < limit) break
    offset += limit
  }
  return products
}

async function getDefaultSalesChannelId() {
  const res = await api("GET", "/admin/sales-channels?limit=1")
  return res.sales_channels?.[0]?.id || null
}

// ── seed source of truth ───────────────────────────────────────────────────
const seed = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "apps/storefront/src/data/products-seed.json"), "utf-8")
)

// Per-product overrides: existing variants on live whose SKUs were renamed.
// Map: handle → { oldSku: newSku }
const SKU_RENAMES = {
  tesamorelin: { "CL-TES-0005": "CL-TES-0010" },
}

// Live products use different handles for some entries (legacy). The seed
// follows the canonical handles from docs/ops/strategy/product-architecture.md;
// these aliases let us update the existing live product instead of creating a
// duplicate. Resolved by handle when fetching live.
const HANDLE_ALIASES = {
  "melanotan-ii": "melanotan-2",
}

// ── apply ──────────────────────────────────────────────────────────────────
const stats = { productsCreated: 0, variantsCreated: 0, variantsUpdated: 0, variantsDeleted: 0, errors: 0 }

function log(...args) {
  console.log(...args)
}

function dryLog(action, detail) {
  log(`  ${DRY_RUN ? "[DRY]" : "[APPLY]"} ${action} ${detail}`)
}

async function ensureProduct(seedProduct, salesChannelId, liveByHandle) {
  const handle = seedProduct.handle
  const liveHandle = HANDLE_ALIASES[handle] || handle
  const live = liveByHandle.get(liveHandle) || liveByHandle.get(handle)
  const visibleVariants = seedProduct.variants.filter((v) => !v.hidden)

  if (!live) {
    // CREATE new product with all visible variants
    const payload = {
      title: seedProduct.title,
      handle,
      description: seedProduct.description || "",
      status: "published",
      metadata: cleanMetadata(seedProduct.metadata || {}),
      options: [{ title: "Size", values: visibleVariants.map((v) => v.size) }],
      variants: visibleVariants.map((v) => ({
        title: v.size,
        sku: v.sku,
        manage_inventory: false,
        prices: buildPrices(v.price),
        options: { Size: v.size },
      })),
      images: seedProduct.thumbnail ? [{ url: seedProduct.thumbnail }] : [],
      thumbnail: seedProduct.thumbnail || undefined,
      sales_channels: salesChannelId ? [{ id: salesChannelId }] : undefined,
    }
    dryLog("CREATE product", `${handle} (${visibleVariants.length} variants)`)
    if (!DRY_RUN) {
      try {
        await api("POST", "/admin/products", payload)
        stats.productsCreated++
        stats.variantsCreated += visibleVariants.length
      } catch (e) {
        log(`    ERROR: ${e.message}`)
        stats.errors++
      }
    } else {
      stats.productsCreated++
      stats.variantsCreated += visibleVariants.length
    }
    return
  }

  // PRODUCT EXISTS — reconcile variants
  const productId = live.id
  const renames = SKU_RENAMES[handle] || {}
  const liveBySku = new Map(live.variants.map((v) => [v.sku, v]))

  // Ensure the Size option includes every size we're about to add. Medusa 2.x
  // rejects variant create with "Option value X does not exist for option Size"
  // unless the option's values list is expanded first.
  const sizeOption = (live.options || []).find((o) => o.title === "Size")
  if (sizeOption) {
    const liveValues = new Set((sizeOption.values || []).map((v) => v.value ?? v))
    const neededValues = visibleVariants.map((v) => v.size)
    const missing = neededValues.filter((s) => !liveValues.has(s))
    if (missing.length) {
      const fullValues = [...liveValues, ...missing]
      dryLog("EXPAND option", `${handle} Size += [${missing.join(", ")}]`)
      if (!DRY_RUN) {
        try {
          await api("POST", `/admin/products/${productId}/options/${sizeOption.id}`, {
            title: "Size",
            values: fullValues,
          })
        } catch (e) { log(`    ERROR: ${e.message}`); stats.errors++ }
      }
    }
  }

  // Track which live variants we've claimed so we can delete the rest
  const claimedVariantIds = new Set()

  for (const seedVariant of seedProduct.variants) {
    if (seedVariant.hidden) {
      // Hidden in seed — delete it from live if present
      const lv = liveBySku.get(seedVariant.sku)
      if (lv) {
        dryLog("DELETE variant", `${handle}/${seedVariant.sku} (hidden in seed)`)
        if (!DRY_RUN) {
          try {
            await api("DELETE", `/admin/products/${productId}/variants/${lv.id}`)
            stats.variantsDeleted++
          } catch (e) { log(`    ERROR: ${e.message}`); stats.errors++ }
        } else {
          stats.variantsDeleted++
        }
        claimedVariantIds.add(lv.id)
      }
      continue
    }

    // Visible variant — find on live by new SKU, falling back to renamed-from SKU
    let lv = liveBySku.get(seedVariant.sku)
    if (!lv) {
      // Reverse rename: which old SKU maps to this new SKU?
      const oldSku = Object.entries(renames).find(([, newSku]) => newSku === seedVariant.sku)?.[0]
      if (oldSku) lv = liveBySku.get(oldSku)
    }

    if (lv) {
      claimedVariantIds.add(lv.id)
      const skuChanged = lv.sku !== seedVariant.sku
      const newPrices = buildPrices(seedVariant.price)
      dryLog(
        "UPDATE variant",
        `${handle}/${seedVariant.sku}${skuChanged ? ` (was ${lv.sku})` : ""} → $${seedVariant.price}`
      )
      if (!DRY_RUN) {
        try {
          await api("POST", `/admin/products/${productId}/variants/${lv.id}`, {
            sku: seedVariant.sku,
            prices: newPrices,
          })
          stats.variantsUpdated++
        } catch (e) { log(`    ERROR: ${e.message}`); stats.errors++ }
      } else {
        stats.variantsUpdated++
      }
    } else {
      // CREATE new variant on existing product
      dryLog("CREATE variant", `${handle}/${seedVariant.sku} @ $${seedVariant.price}`)
      if (!DRY_RUN) {
        try {
          await api("POST", `/admin/products/${productId}/variants`, {
            title: seedVariant.size,
            sku: seedVariant.sku,
            manage_inventory: false,
            prices: buildPrices(seedVariant.price),
            options: { Size: seedVariant.size },
          })
          stats.variantsCreated++
        } catch (e) { log(`    ERROR: ${e.message}`); stats.errors++ }
      } else {
        stats.variantsCreated++
      }
    }
  }

  // Delete any live variants not claimed (i.e., dropped from the lineup)
  for (const lv of live.variants) {
    if (claimedVariantIds.has(lv.id)) continue
    dryLog("DELETE variant", `${handle}/${lv.sku} (not in seed lineup)`)
    if (!DRY_RUN) {
      try {
        await api("DELETE", `/admin/products/${productId}/variants/${lv.id}`)
        stats.variantsDeleted++
      } catch (e) { log(`    ERROR: ${e.message}`); stats.errors++ }
    } else {
      stats.variantsDeleted++
    }
  }
}

function cleanMetadata(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== "" && v != null) out[k] = v
  }
  return out
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  log("=".repeat(60))
  log("  CaliLean Pricing & Catalog Sync")
  log(`  Backend: ${BACKEND_URL}`)
  log(`  Mode: ${DRY_RUN ? "DRY RUN" : "APPLY"}`)
  log("=".repeat(60))

  await authenticate()
  log("✓ Authenticated\n")

  const salesChannelId = await getDefaultSalesChannelId()
  log(`✓ Sales channel: ${salesChannelId}\n`)

  log("Fetching live products...")
  const liveProducts = await fetchAllProducts()
  log(`✓ ${liveProducts.length} products live\n`)

  const liveByHandle = new Map(liveProducts.map((p) => [p.handle, p]))

  // Pre-sync summary (account for handle aliases)
  const seedHandles = new Set(
    seed.flatMap((p) => [p.handle, HANDLE_ALIASES[p.handle]].filter(Boolean))
  )
  const liveOnly = liveProducts.filter((p) => !seedHandles.has(p.handle))
  if (liveOnly.length) {
    log(`⚠ ${liveOnly.length} live products NOT in seed (will be left alone):`)
    for (const p of liveOnly) log(`    - ${p.handle} (${p.variants.length} variants)`)
    log("")
  }

  log("Reconciling seed → live...\n")
  for (const seedProduct of seed) {
    await ensureProduct(seedProduct, salesChannelId, liveByHandle)
  }

  log("\n" + "=".repeat(60))
  log("  Summary")
  log("=".repeat(60))
  log(`  Products created:  ${stats.productsCreated}`)
  log(`  Variants created:  ${stats.variantsCreated}`)
  log(`  Variants updated:  ${stats.variantsUpdated}`)
  log(`  Variants deleted:  ${stats.variantsDeleted}`)
  log(`  Errors:            ${stats.errors}`)
  if (DRY_RUN) log("\n  (DRY RUN — no changes applied. Re-run without --dry-run to apply.)")
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
