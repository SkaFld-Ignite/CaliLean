import { CaliLeanClient } from "../client"
import { CaliLeanConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LiveShippingProfile {
  id: string
  name: string
  type: string
}

interface LiveShippingOption {
  id: string
  name: string
  price_type: string
  amount?: number
  is_return: boolean
  admin_only: boolean
  provider_id?: string
  region_id?: string
  metadata?: Record<string, unknown>
}

interface ShippingDump {
  profiles: LiveShippingProfile[]
  options: LiveShippingOption[]
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpShipping(client: CaliLeanClient): Promise<ShippingDump> {
  const [profilesRes, optionsRes] = await Promise.all([
    client.get<{ shipping_profiles: LiveShippingProfile[] }>(
      "/shipping-profiles?limit=50"
    ),
    client.get<{ shipping_options: LiveShippingOption[] }>(
      "/shipping-options?limit=50"
    ),
  ])

  verbose(
    `Fetched ${profilesRes.shipping_profiles.length} profiles, ${optionsRes.shipping_options.length} options`
  )

  return {
    profiles: profilesRes.shipping_profiles,
    options: optionsRes.shipping_options,
  }
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncShipping(
  client: CaliLeanClient,
  config: NonNullable<CaliLeanConfig["shipping"]>,
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose("Syncing shipping configuration")

  const live = await dumpShipping(client)

  // ── Profiles ──────────────────────────────────────────────────────────
  if (config.profiles) {
    const liveProfileByName = new Map<string, LiveShippingProfile>()
    for (const p of live.profiles) {
      liveProfileByName.set(p.name, p)
    }

    for (const profile of config.profiles) {
      const existing = liveProfileByName.get(profile.name)

      if (existing) {
        // Profile exists — check type match
        if (existing.type === profile.type) {
          log.skip("shipping-profiles", profile.name)
          result.skipped++
        } else {
          // Profiles can't easily be updated (type is usually immutable)
          log.warn(
            `shipping-profiles/${profile.name}: type mismatch (live="${existing.type}", config="${profile.type}") — manual fix required`
          )
          result.skipped++
        }
        continue
      }

      // CREATE
      verbose(`shipping-profiles/${profile.name}: not found, creating`)
      if (!dryRun) {
        try {
          await client.post("/shipping-profiles", {
            name: profile.name,
            type: profile.type,
          })
          log.create("shipping-profiles", profile.name)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          log.error(`shipping-profiles/${profile.name}: ${message}`)
          continue
        }
      } else {
        log.create("shipping-profiles", profile.name)
      }
      result.created++
    }
  }

  // ── Options ───────────────────────────────────────────────────────────
  if (config.options) {
    const liveOptionByName = new Map<string, LiveShippingOption>()
    for (const o of live.options) {
      liveOptionByName.set(o.name, o)
    }

    for (const option of config.options) {
      const existing = liveOptionByName.get(option.name)

      if (existing) {
        log.skip("shipping-options", option.name)
        result.skipped++
        continue
      }

      // Shipping options require fulfillment sets + service zones — warn
      log.warn(
        `shipping-options/${option.name}: not found — creation requires manual admin setup (fulfillment sets + service zones)`
      )
      result.skipped++
    }
  }

  return result
}
