#!/usr/bin/env node
/**
 * Generate QR campaigns (DB) + PNG assets for all published product variants.
 * Run from repo root: node scripts/generate-qr-codes.mjs
 */
import pg from "pg"
import QRCode from "qrcode"
import crypto from "crypto"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, "../docs/brand/packaging/qr-codes")
const STOREFRONT = "https://calilean.com"
const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:nsPLfRsClteLsLEjmwWIRsaktgNTgMhu@turntable.proxy.rlwy.net:26273/railway"

// Category colors — favicon mark + QR code color per brand spec
const CATEGORY_COLORS = {
  repair:    "#B8622E", // Ember
  metabolic: "#6D8AA7", // Pacific
  ghaxis:    "#5B6E8A", // Slate
  longevity: "#7C8A78", // Eucalyptus
  specialty: "#8A6E5B", // Driftwood
  accessory: "#8B9298", // Fog
}

// All 20 new variant campaigns (existing 3 products already have QR codes)
const CAMPAIGNS = [
  // BPC-157
  { handle: "bpc-157", title: "BPC-157", size: "5mg",  variantId: "variant_01KKVY3H8PK44N968DVJZGKB9P", productId: "prod_01KKVY3H63QW7HBX13G12Z0ZTZ", category: "repair" },
  { handle: "bpc-157", title: "BPC-157", size: "10mg", variantId: "variant_01KKVY3H8QW9V8JVNV1NQMMBBE", productId: "prod_01KKVY3H63QW7HBX13G12Z0ZTZ", category: "repair" },
  // CL-1S
  { handle: "cl-1s",  title: "CL-1S",   size: "10mg", variantId: "variant_01KQAXNCDXC1KEK547JMZ3994C", productId: "prod_01KQAXNARSC5E9MWBZ9VKYTSMK", category: "metabolic" },
  { handle: "cl-1s",  title: "CL-1S",   size: "30mg", variantId: "variant_01KQAXNCDY76MWP78PHM4QA3CF", productId: "prod_01KQAXNARSC5E9MWBZ9VKYTSMK", category: "metabolic" },
  // CL-2T
  { handle: "cl-2t",  title: "CL-2T",   size: "10mg", variantId: "variant_01KQAXPBHRXF9Z2PQXVM275AFN", productId: "prod_01KQAXP9XV9S9CDPJGHTT0KA0C", category: "metabolic" },
  { handle: "cl-2t",  title: "CL-2T",   size: "30mg", variantId: "variant_01KQAXPBHR11CGJ24XJKC0YTVW", productId: "prod_01KQAXP9XV9S9CDPJGHTT0KA0C", category: "metabolic" },
  // GHK-Cu
  { handle: "ghk-cu", title: "GHK-Cu",  size: "50mg",  variantId: "variant_01KKVY3KNM1Y3XDPMZN471H0XF", productId: "prod_01KKVY3KKQT8XCG39E3WNJP0TG", category: "repair" },
  { handle: "ghk-cu", title: "GHK-Cu",  size: "100mg", variantId: "variant_01KKVY3KNN6WGV631VB2CFM4QR", productId: "prod_01KKVY3KKQT8XCG39E3WNJP0TG", category: "repair" },
  // Ipamorelin
  { handle: "ipamorelin", title: "Ipamorelin", size: "10mg", variantId: "variant_01KKVY3JGV56V8GD4CAGCNX5RP", productId: "prod_01KKVY3JF30DG48VSYDEW4XTN8", category: "ghaxis" },
  // KLOW
  { handle: "klow",   title: "KLOW",    size: "80mg", variantId: "variant_01KKVY3P3YN67T6MKH5Q0WCRBN", productId: "prod_01KKVY3P21G0ARTN9HXG2Q8RCY", category: "specialty" },
  // Melanotan 2
  { handle: "melanotan-2", title: "Melanotan 2", size: "10mg", variantId: "variant_01KKVY3YV20ZTSX5GGCRYBAG7N", productId: "prod_01KKVY3YSC9SZD4X653KGVF9NK", category: "specialty" },
  // MOTS-C
  { handle: "mots-c", title: "MOTS-C",  size: "10mg", variantId: "variant_01KQ6KMWN8XDFBSAV93ZHB5J6C", productId: "prod_01KKVY427RN68N5TRW3WP9EF55", category: "longevity" },
  // SS-31
  { handle: "ss-31",  title: "SS-31",   size: "10mg", variantId: "variant_01KQAXPWEJJC5465Z1J2G0JTYC", productId: "prod_01KQAXPTSFFZ3FXV12M1MWM7K8", category: "longevity" },
  { handle: "ss-31",  title: "SS-31",   size: "50mg", variantId: "variant_01KQAXPWEJWHQ3J1R4DQJP5HQW", productId: "prod_01KQAXPTSFFZ3FXV12M1MWM7K8", category: "longevity" },
  // TB-500
  { handle: "tb-500", title: "TB-500",  size: "5mg",  variantId: "variant_01KKVY3K2WK4BTV93MY4A2BW9F", productId: "prod_01KKVY3K187HW5HP7Q3E3NQJCS", category: "repair" },
  { handle: "tb-500", title: "TB-500",  size: "10mg", variantId: "variant_01KKVY3K2XHX2SSC7MDM31MHH6", productId: "prod_01KKVY3K187HW5HP7Q3E3NQJCS", category: "repair" },
  // Tesamorelin
  { handle: "tesamorelin", title: "Tesamorelin", size: "10mg", variantId: "variant_01KQAXPPT4D3J058CVN6JF388R", productId: "prod_01KQAXPN5DTGD3A09TKB3D03WR", category: "ghaxis" },
  { handle: "tesamorelin", title: "Tesamorelin", size: "20mg", variantId: "variant_01KQAXPPT4YZS0DTWHVADJCZQJ", productId: "prod_01KQAXPN5DTGD3A09TKB3D03WR", category: "ghaxis" },
  // Wolverine
  { handle: "wolverine", title: "Wolverine", size: "5mg",  variantId: "variant_01KQAXQ22GE6974HMFQSJ36AZS", productId: "prod_01KQAXQ0DPPJZBN4DD3VZC594E", category: "repair" },
  { handle: "wolverine", title: "Wolverine", size: "10mg", variantId: "variant_01KQAXQ22GEZ4XATPS1C7YRM4Y", productId: "prod_01KQAXQ0DPPJZBN4DD3VZC594E", category: "repair" },
  // CL-3R
  { handle: "cl-3r",  title: "CL-3R",   size: "10mg", variantId: "variant_01KQAXPH5X6WMKJ2AG1X2Y5VVJ", productId: "prod_01KQAXPFHK85WKQVZRBN6KAW5K", category: "metabolic" },
  { handle: "cl-3r",  title: "CL-3R",   size: "30mg", variantId: "variant_01KQAXPH5X6CM9S52G4HTTKRHD", productId: "prod_01KQAXPFHK85WKQVZRBN6KAW5K", category: "metabolic" },
  // GLOW
  { handle: "glow",   title: "GLOW",    size: "70mg", variantId: "variant_01KKVY3NHH7TTFDMTSN6CSRHGN", productId: "prod_01KKVY3NFTRB6744B7BHH85NE8", category: "specialty" },
  // Bac Water
  { handle: "bac-water", title: "Bac Water", size: "3mL",  variantId: "variant_01KQAXQ7PX59PKYJBVNS9BC1DB", productId: "prod_01KQAXQ61V94NGFQDKH25CPK0Q", category: "accessory" },
  { handle: "bac-water", title: "Bac Water", size: "10mL", variantId: "variant_01KQAXQ7PY4HM7VWAPK579KE3X", productId: "prod_01KQAXQ61V94NGFQDKH25CPK0Q", category: "accessory" },
  // NAD+ (added 2026-05-18)
  { handle: "nad", title: "NAD+", size: "500mg",  variantId: "variant_01KRYVTSB4RAANQZ5R1ZZDH6K6", productId: "prod_01KRYVTS94ZQGWWWN63VJNRQ24", category: "longevity" },
  { handle: "nad", title: "NAD+", size: "1000mg", variantId: "variant_01KRYVTSB585NWQ5GZQE2Y5HTJ", productId: "prod_01KRYVTS94ZQGWWWN63VJNRQ24", category: "longevity" },
]

const CATEGORY_COLORS_BY_HANDLE = {
  "bpc-157": "#B8622E",
  "tb-500": "#B8622E",
  "ghk-cu": "#B8622E",
  "wolverine": "#B8622E",
  "cl-1s": "#6D8AA7",
  "cl-2t": "#6D8AA7",
  "cl-3r": "#6D8AA7",
  "ipamorelin": "#5B6E8A",
  "tesamorelin": "#5B6E8A",
  "mots-c": "#7C8A78",
  "ss-31": "#7C8A78",
  "glow": "#8A6E5B",
  "klow": "#8A6E5B",
  "melanotan-2": "#8A6E5B",
  "bac-water": "#8B9298"
}

function makeId() {
  // Medusa-style ULID: timestamp (10 chars) + random (16 chars) in Crockford Base32
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  const now = Date.now()
  let t = now
  let ts = ""
  for (let i = 0; i < 10; i++) {
    ts = chars[t % 32] + ts
    t = Math.floor(t / 32)
  }
  let rand = ""
  const bytes = crypto.randomBytes(10)
  for (const b of bytes) {
    rand += chars[b % 32]
  }
  return ts + rand
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  // Check which codes already exist
  const existing = await client.query("SELECT code FROM qr_campaign")
  const existingCodes = new Set(existing.rows.map((r) => r.code))

  let inserted = 0
  let skipped = 0
  let pngsGenerated = 0

  for (const c of CAMPAIGNS) {
    const code = `${c.handle}-${c.size}`
    const pngFile = path.join(OUT_DIR, `qr-${c.handle}-${c.size}.png`)
    const redirectUrl = `${STOREFRONT}/go/${code}`

    // Insert DB campaign if not already present
    if (existingCodes.has(code)) {
      console.log(`  skip db  ${code}`)
      skipped++
    } else {
      const id = makeId()
      const guestKey = crypto.randomBytes(16).toString("hex")
      await client.query(
        `INSERT INTO qr_campaign
           (id, code, name, destination_url, utm_source, utm_medium, utm_campaign, utm_content,
            scan_count, is_active, product_id, guest_key, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,true,$9,$10,NOW(),NOW())`,
        [
          id,
          code,
          `${c.title} ${c.size}`,
          `/us/products/${c.handle}?variant=${c.variantId}`,
          "qr",
          "print",
          c.handle,
          c.size,
          c.productId,
          guestKey,
        ]
      )
      console.log(`  insert   ${code}`)
      inserted++
    }

    // Always regenerate PNG — use category color from brand spec
    const qrColor = CATEGORY_COLORS[c.category] || "#000000"
    await QRCode.toFile(pngFile, redirectUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 512,
      margin: 2,
      color: { dark: qrColor, light: "#ffffff" },
    })
    console.log(`  png      qr-${c.handle}-${c.size}.png`)
    pngsGenerated++
  }

  await client.end()
  console.log(`\nDone — ${inserted} campaigns inserted, ${skipped} skipped, ${pngsGenerated} PNGs generated.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
