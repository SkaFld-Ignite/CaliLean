#!/usr/bin/env node
/**
 * One-off: generate only the 2 NAD+ QR campaigns + PNGs (2026-05-18).
 * Skips all other variants. Existing PNGs are NOT touched.
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

// Longevity color (Eucalyptus) per brand spec.
const LONGEVITY = "#7C8A78"

const NAD_CAMPAIGNS = [
  {
    handle: "nad",
    title: "NAD+",
    size: "500mg",
    variantId: "variant_01KRYVTSB4RAANQZ5R1ZZDH6K6",
    productId: "prod_01KRYVTS94ZQGWWWN63VJNRQ24",
  },
  {
    handle: "nad",
    title: "NAD+",
    size: "1000mg",
    variantId: "variant_01KRYVTSB585NWQ5GZQE2Y5HTJ",
    productId: "prod_01KRYVTS94ZQGWWWN63VJNRQ24",
  },
]

function makeId() {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  let t = Date.now()
  let ts = ""
  for (let i = 0; i < 10; i++) {
    ts = chars[t % 32] + ts
    t = Math.floor(t / 32)
  }
  let rand = ""
  const bytes = crypto.randomBytes(10)
  for (const b of bytes) rand += chars[b % 32]
  return ts + rand
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  const existing = await client.query("SELECT code FROM qr_campaign WHERE code LIKE 'nad-%'")
  const existingCodes = new Set(existing.rows.map((r) => r.code))

  let inserted = 0
  let skipped = 0
  let pngsGenerated = 0

  for (const c of NAD_CAMPAIGNS) {
    const code = `${c.handle}-${c.size}`
    const pngFile = path.join(OUT_DIR, `qr-${c.handle}-${c.size}.png`)
    const redirectUrl = `${STOREFRONT}/go/${code}`

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

    await QRCode.toFile(pngFile, redirectUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 512,
      margin: 2,
      color: { dark: LONGEVITY, light: "#ffffff" },
    })
    console.log(`  png      qr-${c.handle}-${c.size}.png`)
    pngsGenerated++
  }

  await client.end()
  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped, ${pngsGenerated} PNGs generated.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
