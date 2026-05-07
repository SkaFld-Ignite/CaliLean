import { CaliLeanClient } from "../client"
import { InventoryLocationConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LiveStockLocation {
  id: string
  name: string
  address?: {
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
    phone?: string
    company?: string
  }
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpInventory(
  client: CaliLeanClient
): Promise<LiveStockLocation[]> {
  const res = await client.get<{ stock_locations: LiveStockLocation[] }>(
    "/stock-locations?limit=50"
  )

  verbose(`Fetched ${res.stock_locations.length} stock locations`)

  return res.stock_locations
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncInventory(
  client: CaliLeanClient,
  locations: InventoryLocationConfig[],
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose("Syncing inventory locations")

  const live = await dumpInventory(client)
  const liveByName = new Map<string, LiveStockLocation>()
  for (const loc of live) {
    liveByName.set(loc.name, loc)
  }

  for (const location of locations) {
    const existing = liveByName.get(location.name)

    if (existing) {
      log.skip("stock-locations", location.name)
      result.skipped++
      continue
    }

    // CREATE
    verbose(`stock-locations/${location.name}: not found, creating`)
    if (!dryRun) {
      try {
        await client.post("/stock-locations", {
          name: location.name,
          address: location.address,
        })
        log.create("stock-locations", location.name)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`stock-locations/${location.name}: ${message}`)
        continue
      }
    } else {
      log.create("stock-locations", location.name)
    }
    result.created++
  }

  return result
}
