#!/usr/bin/env node
/**
 * One-off: generate only the MOTS-c 40mg QR campaign + PNG (2026-05-18).
 * Skips all other variants. Existing PNGs are NOT touched.
 * Patterned after scripts/generate-qr-nad.mjs.
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

const CAMPAIGN = {
  handle: "mots-c",
  title: "MOTS-C",
  size: "40mg",
  variantId: "variant_01KQAXKACHH5DC4J3MHRNE0GKB",
  productId: "prod_01KKVY427RN68N5TRW3WP9EF55",
}

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

  const code = `${CAMPAIGN.handle}-${CAMPAIGN.size}`
  const existing = await client.query("SELECT code FROM qr_campaign WHERE code = $1", [code])

  let inserted = 0
  let skipped = 0
  let campaignId = null

  if (existing.rows.length > 0) {
    console.log(`  skip db  ${code} (already exists)`)
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
        `${CAMPAIGN.title} ${CAMPAIGN.size}`,
        `/us/products/${CAMPAIGN.handle}?variant=${CAMPAIGN.variantId}`,
        "qr",
        "print",
        CAMPAIGN.handle,
        CAMPAIGN.size,
        CAMPAIGN.productId,
        guestKey,
      ]
    )
    campaignId = id
    console.log(`  insert   ${code} (id: ${id})`)
    inserted++
  }

  const pngFile = path.join(OUT_DIR, `qr-${CAMPAIGN.handle}-${CAMPAIGN.size}.png`)
  const redirectUrl = `${STOREFRONT}/go/${code}`
  await QRCode.toFile(pngFile, redirectUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: LONGEVITY, light: "#ffffff" },
  })
  console.log(`  png      qr-${CAMPAIGN.handle}-${CAMPAIGN.size}.png  (url: ${redirectUrl})`)

  await client.end()
  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped, 1 PNG generated.`)
  if (campaignId) console.log(`Campaign id: ${campaignId}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
