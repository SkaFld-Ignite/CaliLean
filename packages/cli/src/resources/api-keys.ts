import { CaliLeanClient } from "../client"
import { ApiKeyConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LiveApiKey {
  id: string
  title: string
  type: string
  token: string
  redacted: string
}

interface ApiKeyDump {
  id: string
  title: string
  type: string
  token: string
  redacted: string
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpApiKeys(client: CaliLeanClient): Promise<ApiKeyDump[]> {
  const res = await client.get<{ api_keys: LiveApiKey[] }>("/api-keys?limit=50")

  verbose(`Fetched ${res.api_keys.length} API keys`)

  return res.api_keys.map((k) => ({
    id: k.id,
    title: k.title,
    type: k.type,
    token: k.token,
    redacted: k.redacted,
  }))
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncApiKeys(
  client: CaliLeanClient,
  configs: ApiKeyConfig[],
  salesChannelMap: Map<string, string>,
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose("Syncing API keys")

  const live = await dumpApiKeys(client)
  const liveByTitle = new Map<string, ApiKeyDump>()
  for (const k of live) {
    liveByTitle.set(k.title, k)
  }

  for (const config of configs) {
    const existing = liveByTitle.get(config.title)

    if (existing) {
      log.skip("api-keys", config.title)
      result.skipped++
      continue
    }

    // CREATE
    verbose(`api-keys/${config.title}: not found, creating`)
    if (!dryRun) {
      try {
        const created = await client.post<{ api_key: { id: string } }>("/api-keys", {
          title: config.title,
          type: config.type,
        })

        // Link to sales channels if specified
        if (config.sales_channels?.length) {
          const channelIds: string[] = []
          for (const channelName of config.sales_channels) {
            const channelId = salesChannelMap.get(channelName)
            if (channelId) {
              channelIds.push(channelId)
            } else {
              log.warn(
                `api-keys/${config.title}: sales channel "${channelName}" not found — skipping link`
              )
            }
          }

          if (channelIds.length > 0) {
            await client.post(`/api-keys/${created.api_key.id}/sales-channels`, {
              add: channelIds,
            })
            verbose(
              `api-keys/${config.title}: linked to ${channelIds.length} sales channel(s)`
            )
          }
        }

        log.create("api-keys", config.title)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`api-keys/${config.title}: ${message}`)
        continue
      }
    } else {
      log.create("api-keys", config.title)
    }
    result.created++
  }

  return result
}
