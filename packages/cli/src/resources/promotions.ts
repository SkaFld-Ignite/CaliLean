import { CaliLeanClient } from "../client"
import { PromotionConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LiveApplicationMethod {
  type: string
  value: number
  allocation?: string
  target_type: string
  max_quantity?: number
  buy_rules_min_quantity?: number
}

interface LivePromotion {
  id: string
  code: string
  type: string
  is_automatic: boolean
  campaign?: string | null
  application_method?: LiveApplicationMethod
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpPromotions(client: CaliLeanClient): Promise<LivePromotion[]> {
  const res = await client.get<{ promotions: LivePromotion[] }>(
    "/promotions?limit=100"
  )
  verbose(`Fetched ${res.promotions.length} promotions`)
  return res.promotions
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncPromotions(
  client: CaliLeanClient,
  configs: PromotionConfig[],
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose(`Syncing promotions: ${configs.length} entries`)

  // Fetch live promotions
  const livePromotions = await dumpPromotions(client)
  const liveByCode = new Map<string, LivePromotion>()
  for (const p of livePromotions) {
    liveByCode.set(p.code, p)
  }

  // Track managed codes for unmanaged flagging
  const managedCodes = new Set<string>()

  for (const config of configs) {
    managedCodes.add(config.code)
    const existing = liveByCode.get(config.code)

    if (existing) {
      // Check if in sync by comparing application_method fields
      const inSync = isPromotionInSync(config, existing)

      if (inSync) {
        log.skip("promotions", config.code)
        result.skipped++
      } else {
        // Promotions have limited update capability — log drift
        log.warn(
          `promotions/${config.code}: config drift detected — update not supported, recreate manually`
        )
        result.skipped++
      }
      continue
    }

    // CREATE
    verbose(`promotions/${config.code}: not found, creating`)
    if (!dryRun) {
      try {
        const payload = buildPromotionPayload(config)
        await client.post("/promotions", payload)
        log.create("promotions", config.code)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`promotions/${config.code}: ${message}`)
        continue
      }
    } else {
      log.create("promotions", config.code)
    }
    result.created++
  }

  // Flag unmanaged promotions
  for (const [code] of liveByCode) {
    if (!managedCodes.has(code)) {
      log.unmanaged("promotions", code)
    }
  }

  return result
}

// ── Helpers ───────────────────────────────────────────────────────────────

function isPromotionInSync(config: PromotionConfig, live: LivePromotion): boolean {
  if (config.type !== live.type) return false
  if ((config.is_automatic ?? false) !== live.is_automatic) return false

  if (!live.application_method) return false

  const liveMethod = live.application_method
  const configMethod = config.application_method

  if (configMethod.type !== liveMethod.type) return false
  if (configMethod.value !== liveMethod.value) return false
  if (configMethod.target_type !== liveMethod.target_type) return false
  if ((configMethod.allocation ?? null) !== (liveMethod.allocation ?? null)) return false

  return true
}

function buildPromotionPayload(config: PromotionConfig): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: config.code,
    type: config.type,
    is_automatic: config.is_automatic ?? false,
  }

  if (config.campaign) {
    payload.campaign = config.campaign
  }

  const method: Record<string, unknown> = {
    type: config.application_method.type,
    value: config.application_method.value,
    target_type: config.application_method.target_type,
  }

  if (config.application_method.allocation) {
    method.allocation = config.application_method.allocation
  }
  if (config.application_method.max_quantity != null) {
    method.max_quantity = config.application_method.max_quantity
  }
  if (config.application_method.buy_rules_min_quantity != null) {
    method.buy_rules_min_quantity = config.application_method.buy_rules_min_quantity
  }

  payload.application_method = method

  return payload
}
