import { CaliLeanClient } from "../client"
import { CaliLeanConfig } from "../schema/config"
import { diffObjects } from "../engine/diff"
import { log, verbose } from "../utils/logger"

interface LiveStore {
  id: string
  name: string
  default_currency_code: string
  supported_currencies: Array<{ currency_code: string }>
}

interface StoreConfig {
  name: string
  default_currency: string
  supported_currencies: string[]
}

interface StoreDump {
  name: string
  default_currency: string
  supported_currencies: string[]
}

const STORE_DIFF_FIELDS = ["name", "default_currency", "supported_currencies"]

function liveToConfig(live: LiveStore): StoreDump {
  return {
    name: live.name,
    default_currency: live.default_currency_code,
    supported_currencies: live.supported_currencies.map((c) => c.currency_code).sort(),
  }
}

export async function dumpStore(client: CaliLeanClient): Promise<StoreDump> {
  const res = await client.get<{ stores: LiveStore[] }>("/stores")
  const live = res.stores[0]
  if (!live) throw new Error("No store found in Medusa instance")
  return liveToConfig(live)
}

export async function syncStore(
  client: CaliLeanClient,
  config: CaliLeanConfig["store"],
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  verbose("Syncing store settings")

  const res = await client.get<{ stores: LiveStore[] }>("/stores")
  const live = res.stores[0]
  if (!live) throw new Error("No store found in Medusa instance")

  const desired: Record<string, unknown> = {
    name: config.name,
    default_currency: config.default_currency,
    supported_currencies: [...config.supported_currencies].sort(),
  }

  const current: Record<string, unknown> = {
    name: live.name,
    default_currency: live.default_currency_code,
    supported_currencies: live.supported_currencies.map((c) => c.currency_code).sort(),
  }

  const diffs = diffObjects(desired, current, STORE_DIFF_FIELDS)

  if (diffs.length === 0) {
    log.skip("store", config.name)
    return { created: 0, updated: 0, skipped: 1 }
  }

  verbose(`store/${config.name}: ${diffs.length} field(s) changed`)
  for (const diff of diffs) {
    log.field(diff.path, diff.from, diff.to)
  }

  if (!dryRun) {
    const payload: Record<string, unknown> = {
      name: config.name,
      supported_currencies: config.supported_currencies.map((code) => ({
        currency_code: code,
      })),
      default_currency_code: config.default_currency,
    }
    await client.post(`/store/${live.id}`, payload)
    log.update("store", config.name)
  } else {
    log.update("store", config.name)
  }

  return { created: 0, updated: 1, skipped: 0 }
}
