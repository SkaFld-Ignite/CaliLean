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

// All 20 new variant campaigns (existing 3 products already have QR codes)
const CAMPAIGNS = [
  // BPC-157
  { handle: "bpc-157", title: "BPC-157", size: "5mg",  variantId: "variant_01KKVY3H8PK44N968DVJZGKB9P", productId: "prod_01KKVY3H63QW7HBX13G12Z0ZTZ" },
  { handle: "bpc-157", title: "BPC-157", size: "10mg", variantId: "variant_01KKVY3H8QW9V8JVNV1NQMMBBE", productId: "prod_01KKVY3H63QW7HBX13G12Z0ZTZ" },
  // CL-1S
  { handle: "cl-1s",  title: "CL-1S",   size: "10mg", variantId: "variant_01KQAXNCDXC1KEK547JMZ3994C", productId: "prod_01KQAXNARSC5E9MWBZ9VKYTSMK" },
  { handle: "cl-1s",  title: "CL-1S",   size: "30mg", variantId: "variant_01KQAXNCDY76MWP78PHM4QA3CF", productId: "prod_01KQAXNARSC5E9MWBZ9VKYTSMK" },
  // CL-2T
  { handle: "cl-2t",  title: "CL-2T",   size: "10mg", variantId: "variant_01KQAXPBHRXF9Z2PQXVM275AFN", productId: "prod_01KQAXP9XV9S9CDPJGHTT0KA0C" },
  { handle: "cl-2t",  title: "CL-2T",   size: "30mg", variantId: "variant_01KQAXPBHR11CGJ24XJKC0YTVW", productId: "prod_01KQAXP9XV9S9CDPJGHTT0KA0C" },
  // GHK-Cu
  { handle: "ghk-cu", title: "GHK-Cu",  size: "50mg",  variantId: "variant_01KKVY3KNM1Y3XDPMZN471H0XF", productId: "prod_01KKVY3KKQT8XCG39E3WNJP0TG" },
  { handle: "ghk-cu", title: "GHK-Cu",  size: "100mg", variantId: "variant_01KKVY3KNN6WGV631VB2CFM4QR", productId: "prod_01KKVY3KKQT8XCG39E3WNJP0TG" },
  // Ipamorelin
  { handle: "ipamorelin", title: "Ipamorelin", size: "10mg", variantId: "variant_01KKVY3JGV56V8GD4CAGCNX5RP", productId: "prod_01KKVY3JF30DG48VSYDEW4XTN8" },
  // KLOW
  { handle: "klow",   title: "KLOW",    size: "80mg", variantId: "variant_01KKVY3P3YN67T6MKH5Q0WCRBN", productId: "prod_01KKVY3P21G0ARTN9HXG2Q8RCY" },
  // Melanotan 2
  { handle: "melanotan-2", title: "Melanotan 2", size: "10mg", variantId: "variant_01KKVY3YV20ZTSX5GGCRYBAG7N", productId: "prod_01KKVY3YSC9SZD4X653KGVF9NK" },
  // MOTS-C
  { handle: "mots-c", title: "MOTS-C",  size: "10mg", variantId: "variant_01KQ6KMWN8XDFBSAV93ZHB5J6C", productId: "prod_01KKVY427RN68N5TRW3WP9EF55" },
  // SS-31
  { handle: "ss-31",  title: "SS-31",   size: "10mg", variantId: "variant_01KQAXPWEJJC5465Z1J2G0JTYC", productId: "prod_01KQAXPTSFFZ3FXV12M1MWM7K8" },
  { handle: "ss-31",  title: "SS-31",   size: "50mg", variantId: "variant_01KQAXPWEJWHQ3J1R4DQJP5HQW", productId: "prod_01KQAXPTSFFZ3FXV12M1MWM7K8" },
  // TB-500
  { handle: "tb-500", title: "TB-500",  size: "5mg",  variantId: "variant_01KKVY3K2WK4BTV93MY4A2BW9F", productId: "prod_01KKVY3K187HW5HP7Q3E3NQJCS" },
  { handle: "tb-500", title: "TB-500",  size: "10mg", variantId: "variant_01KKVY3K2XHX2SSC7MDM31MHH6", productId: "prod_01KKVY3K187HW5HP7Q3E3NQJCS" },
  // Tesamorelin
  { handle: "tesamorelin", title: "Tesamorelin", size: "10mg", variantId: "variant_01KQAXPPT4D3J058CVN6JF388R", productId: "prod_01KQAXPN5DTGD3A09TKB3D03WR" },
  { handle: "tesamorelin", title: "Tesamorelin", size: "20mg", variantId: "variant_01KQAXPPT4YZS0DTWHVADJCZQJ", productId: "prod_01KQAXPN5DTGD3A09TKB3D03WR" },
  // Wolverine
  { handle: "wolverine", title: "Wolverine", size: "5mg",  variantId: "variant_01KQAXQ22GE6974HMFQSJ36AZS", productId: "prod_01KQAXQ0DPPJZBN4DD3VZC594E" },
  { handle: "wolverine", title: "Wolverine", size: "10mg", variantId: "variant_01KQAXQ22GEZ4XATPS1C7YRM4Y", productId: "prod_01KQAXQ0DPPJZBN4DD3VZC594E" },
]

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

    // Always regenerate PNG
    await QRCode.toFile(pngFile, redirectUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
    console.log(`  png      qr-${c.handle}-${c.size}.png`)
    pngsGenerated++
  }

  await client.end()
  console.log(`\nDone — ${inserted} campaigns inserted, ${skipped} skipped, ${pngsGenerated} PNGs generated.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
