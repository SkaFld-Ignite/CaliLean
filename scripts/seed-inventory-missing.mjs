#!/usr/bin/env node
/**
 * One-off (2026-05-18): set stocked_quantity = 100 at US Warehouse for the 5
 * active variants that currently have manage_inventory = false and no
 * inventory_item link. Reuses the existing admin API pattern from sync-pricing.mjs.
 *
 * Targets (verified live):
 *   CL-GL2-0020  variant_01KRYVVSTYPA3TCXX3159CT21B  prod_01KRYVVSPN8H92H1ZBV61DM9X9  cl-2t
 *   CL-GL2-0040  variant_01KRYVVT22P5XPGWX9A4TJ5TDR  prod_01KRYVVSPN8H92H1ZBV61DM9X9  cl-2t
 *   CL-NAD-0500  variant_01KRYVTSB4RAANQZ5R1ZZDH6K6  prod_01KRYVTS94ZQGWWWN63VJNRQ24  nad
 *   CL-NAD-1000  variant_01KRYVTSB585NWQ5GZQE2Y5HTJ  prod_01KRYVTS94ZQGWWWN63VJNRQ24  nad
 *   CL-WLV-0020  variant_01KRYVVS6C3W2SXPQWFVRV42CG  prod_01KKVY3R3VG4P5BQHKHSP5GHHC  wolverine
 *
 * Stock location: sloc_01KKW2CZ5YJTV595F4NMWKQN75 ("US Warehouse")
 *
 * Env:
 *   DRY_RUN=1 → preview only, no writes
 *   ONLY_SKU=CL-WLV-0020 → run for just one SKU (smoke test)
 */

const BACKEND = process.env.MEDUSA_BACKEND_URL || "https://admin.calilean.com"
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error("FATAL: MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD required")
  process.exit(1)
}
const LOCATION_ID = "sloc_01KKW2CZ5YJTV595F4NMWKQN75"
const STOCKED_QTY = 100
// CLI args: --dry-run, --sku=CL-WLV-0020
const argv = process.argv.slice(2)
const DRY_RUN = !!process.env.DRY_RUN || argv.includes("--dry-run")
const SKU_ARG = argv.find((a) => a.startsWith("--sku="))
const ONLY_SKU = process.env.ONLY_SKU || (SKU_ARG ? SKU_ARG.split("=")[1] : null)

const TARGETS = [
  { sku: "CL-GL2-0020", variantId: "variant_01KRYVVSTYPA3TCXX3159CT21B", productId: "prod_01KQAXP9XV9S9CDPJGHTT0KA0C" },
  { sku: "CL-GL2-0040", variantId: "variant_01KRYVVT22P5XPGWX9A4TJ5TDR", productId: "prod_01KQAXP9XV9S9CDPJGHTT0KA0C" },
  { sku: "CL-NAD-0500", variantId: "variant_01KRYVTSB4RAANQZ5R1ZZDH6K6", productId: "prod_01KRYVTS94ZQGWWWN63VJNRQ24" },
  { sku: "CL-NAD-1000", variantId: "variant_01KRYVTSB585NWQ5GZQE2Y5HTJ", productId: "prod_01KRYVTS94ZQGWWWN63VJNRQ24" },
  { sku: "CL-WLV-0020", variantId: "variant_01KRYVVS6C3W2SXPQWFVRV42CG", productId: "prod_01KQAXQ0DPPJZBN4DD3VZC594E" },
]

let token = null

async function api(method, p, body) {
  const url = `${BACKEND}${p}`
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${p} → ${res.status}: ${text.slice(0, 400)}`)
  }
  return res.status === 204 ? null : res.json()
}

async function authenticate() {
  const res = await fetch(`${BACKEND}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const json = await res.json()
  if (!json.token) throw new Error(`Auth missing token: ${JSON.stringify(json)}`)
  token = json.token
}

async function ensureInventoryForVariant({ sku, variantId, productId }) {
  console.log(`\n— ${sku} ———————————————————————————————`)

  // 1) Fetch variant base fields
  const cur = await api("GET", `/admin/products/${productId}/variants/${variantId}`)
  const v = cur.variant
  // Look up existing inventory_item link via /admin/inventory-items?q=<sku>
  const iiList = await api("GET", `/admin/inventory-items?sku=${encodeURIComponent(sku)}`)
  const existingItem = (iiList.inventory_items || []).find((it) => it.sku === sku) || null
  const prev = {
    manage_inventory: v.manage_inventory,
    inventory_item_id: existingItem?.id || null,
  }
  console.log(
    `  prev: manage_inventory=${prev.manage_inventory}, inventory_item=${prev.inventory_item_id || "<none>"}`
  )

  // 2) Flip manage_inventory → true
  if (!prev.manage_inventory) {
    if (DRY_RUN) {
      console.log(`  [DRY] PATCH variant ${variantId} → { manage_inventory: true }`)
    } else {
      await api("POST", `/admin/products/${productId}/variants/${variantId}`, { manage_inventory: true })
      console.log(`  ✓ manage_inventory=true`)
    }
  } else {
    console.log(`  skip: manage_inventory already true`)
  }

  // 3) Ensure inventory_item exists and is linked
  let inventoryItemId = prev.inventory_item_id

  if (!inventoryItemId) {
    if (DRY_RUN) {
      console.log(`  [DRY] POST /admin/inventory-items  body=${JSON.stringify({ sku, title: sku })}`)
      console.log(`  [DRY] (then link to variant via /admin/products/.../variants/.../inventory)`)
    } else {
      const created = await api("POST", `/admin/inventory-items`, { sku, title: sku })
      inventoryItemId = created.inventory_item.id
      console.log(`  ✓ created inventory_item: ${inventoryItemId}`)
      // Link to variant
      const linked = await api("POST", `/admin/inventory-items/${inventoryItemId}/variants`, {
        required_quantity: 1,
        variant_id: variantId,
      }).catch(async (e) => {
        // Fallback: alternative association endpoint
        console.log(`  warn: /variants link failed (${e.message}); trying variant endpoint`)
        return api("POST", `/admin/products/${productId}/variants/${variantId}/inventory-items`, {
          inventory_item_id: inventoryItemId,
          required_quantity: 1,
        })
      })
      console.log(`  ✓ linked inventory_item ↔ variant`)
    }
  } else {
    console.log(`  skip: inventory_item already exists: ${inventoryItemId}`)
  }

  // 4) Set/create the location-level
  if (DRY_RUN) {
    console.log(
      `  [DRY] POST /admin/inventory-items/${inventoryItemId || "<new>"}/location-levels  body=${JSON.stringify({
        location_id: LOCATION_ID,
        stocked_quantity: STOCKED_QTY,
      })}`
    )
    return
  }

  // Try create-or-update by attempting POST first
  try {
    await api("POST", `/admin/inventory-items/${inventoryItemId}/location-levels`, {
      location_id: LOCATION_ID,
      stocked_quantity: STOCKED_QTY,
    })
    console.log(`  ✓ created level @ ${LOCATION_ID} → ${STOCKED_QTY}`)
  } catch (e) {
    // Likely already exists — try POST update endpoint
    if (/already|exists|409|422/i.test(e.message)) {
      await api("POST", `/admin/inventory-items/${inventoryItemId}/location-levels/${LOCATION_ID}`, {
        stocked_quantity: STOCKED_QTY,
      })
      console.log(`  ✓ updated level @ ${LOCATION_ID} → ${STOCKED_QTY}`)
    } else {
      throw e
    }
  }
}

async function main() {
  await authenticate()
  console.log(`Authenticated → ${BACKEND} (DRY_RUN=${DRY_RUN}, ONLY_SKU=${ONLY_SKU || "all"})`)
  const list = ONLY_SKU ? TARGETS.filter((t) => t.sku === ONLY_SKU) : TARGETS
  for (const t of list) {
    try {
      await ensureInventoryForVariant(t)
    } catch (e) {
      console.error(`  ✗ ${t.sku}: ${e.message}`)
      throw e
    }
  }
  console.log(`\nDone (${DRY_RUN ? "dry-run" : "applied"}).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
