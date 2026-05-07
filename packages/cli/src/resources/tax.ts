import { CaliLeanClient } from "../client"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LiveTaxRegion {
  id: string
  country_code: string
  province_code?: string
  rate?: number
  name?: string
  [key: string]: unknown
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpTax(client: CaliLeanClient): Promise<LiveTaxRegion[]> {
  const res = await client.get<{ tax_regions: LiveTaxRegion[] }>(
    "/tax-regions?limit=50"
  )

  verbose(`Fetched ${res.tax_regions.length} tax regions`)

  return res.tax_regions
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncTax(): Promise<{
  created: number
  updated: number
  skipped: number
}> {
  verbose("Tax: managed via automatic_taxes flag on regions")
  log.dim("Tax: managed via regions — no separate sync required")
  return { created: 0, updated: 0, skipped: 0 }
}
