import { CaliLeanClient } from "../client"
import { SalesChannelConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LiveSalesChannel {
  id: string
  name: string
  description: string | null
  is_disabled: boolean
}

interface SalesChannelDump {
  id: string
  name: string
  description: string | null
  is_disabled: boolean
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpSalesChannels(
  client: CaliLeanClient
): Promise<SalesChannelDump[]> {
  const res = await client.get<{ sales_channels: LiveSalesChannel[] }>(
    "/sales-channels?limit=50"
  )

  verbose(`Fetched ${res.sales_channels.length} sales channels`)

  return res.sales_channels.map((sc) => ({
    id: sc.id,
    name: sc.name,
    description: sc.description,
    is_disabled: sc.is_disabled,
  }))
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncSalesChannels(
  client: CaliLeanClient,
  configs: SalesChannelConfig[],
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose("Syncing sales channels")

  const live = await dumpSalesChannels(client)
  const liveByName = new Map<string, SalesChannelDump>()
  for (const sc of live) {
    liveByName.set(sc.name, sc)
  }

  for (const config of configs) {
    const existing = liveByName.get(config.name)

    if (existing) {
      log.skip("sales-channels", config.name)
      result.skipped++
      continue
    }

    // CREATE
    verbose(`sales-channels/${config.name}: not found, creating`)
    if (!dryRun) {
      try {
        await client.post("/sales-channels", {
          name: config.name,
          description: config.description ?? "",
          is_disabled: config.is_disabled ?? false,
        })
        log.create("sales-channels", config.name)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`sales-channels/${config.name}: ${message}`)
        continue
      }
    } else {
      log.create("sales-channels", config.name)
    }
    result.created++
  }

  return result
}
