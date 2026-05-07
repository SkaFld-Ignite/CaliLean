import { CaliLeanClient } from "../client"
import { log, verbose } from "../utils/logger"
import { ResourceHandler, SyncResult } from "./types"
import { diffObjects } from "./diff"

export async function syncResource<TConfig, TLive extends { id: string }>(
  client: CaliLeanClient,
  handler: ResourceHandler<TConfig, TLive>,
  configs: TConfig[],
  dryRun: boolean = false
): Promise<SyncResult> {
  const result: SyncResult = {
    resource: handler.name,
    created: 0,
    updated: 0,
    skipped: 0,
    unmanaged: 0,
    errors: [],
  }

  verbose(`Syncing ${handler.name}: ${configs.length} config entries`)

  // Fetch live records
  let liveRecords: TLive[]
  try {
    liveRecords = await handler.dump(client)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    result.errors.push({ key: "*", error: `Failed to fetch live records: ${message}` })
    return result
  }

  verbose(`Found ${liveRecords.length} live ${handler.name} records`)

  // Index live records by key
  const liveByKey = new Map<string, TLive>()
  for (const live of liveRecords) {
    liveByKey.set(handler.getLiveKey(live), live)
  }

  // Track which live keys are matched by config
  const matchedKeys = new Set<string>()

  // Process each config entry
  for (const config of configs) {
    const key = handler.getKey(config)
    const existing = liveByKey.get(key)
    matchedKeys.add(key)

    if (!existing) {
      // CREATE
      verbose(`${handler.name}/${key}: not found, creating`)
      if (!dryRun) {
        try {
          const payload = handler.toPayload(config)
          await client.post(`/${handler.name}`, payload)
          log.create(handler.name, key)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          result.errors.push({ key, error: message })
          continue
        }
      } else {
        log.create(handler.name, key)
      }
      result.created++
    } else {
      // DIFF
      const desired = handler.toPayload(config, existing) as Record<string, unknown>
      const current = handler.toPayload(handler.toConfig(existing), existing) as Record<string, unknown>
      const diffs = diffObjects(desired, current, handler.diffFields)

      if (diffs.length === 0) {
        // SKIP
        log.skip(handler.name, key)
        result.skipped++
      } else {
        // UPDATE
        verbose(`${handler.name}/${key}: ${diffs.length} field(s) changed`)
        for (const diff of diffs) {
          log.field(diff.path, diff.from, diff.to)
        }
        if (!dryRun) {
          try {
            const payload = handler.toPayload(config, existing)
            await client.post(`/${handler.name}/${existing.id}`, payload)
            log.update(handler.name, key)
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            result.errors.push({ key, error: message })
            continue
          }
        } else {
          log.update(handler.name, key)
        }
        result.updated++
      }
    }
  }

  // Flag unmanaged records
  for (const live of liveRecords) {
    const liveKey = handler.getLiveKey(live)
    if (!matchedKeys.has(liveKey)) {
      log.unmanaged(handler.name, liveKey)
      result.unmanaged++
    }
  }

  return result
}
