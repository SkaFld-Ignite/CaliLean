import { CaliLeanClient } from "../client"
import { RegionConfig } from "../schema/config"
import { ResourceHandler } from "../engine/types"

interface LiveCountry {
  iso_2: string
  [key: string]: unknown
}

interface LiveRegion {
  id: string
  name: string
  currency_code: string
  countries: LiveCountry[]
  automatic_taxes: boolean
  tax_rate?: number
  payment_providers?: Array<{ id: string }>
}

function toConfig(live: LiveRegion): RegionConfig {
  return {
    name: live.name,
    currency_code: live.currency_code,
    countries: live.countries.map((c) => c.iso_2).sort(),
    automatic_taxes: live.automatic_taxes,
    ...(live.tax_rate != null ? { tax_rate: live.tax_rate } : {}),
    ...(live.payment_providers?.length
      ? { payment_providers: live.payment_providers.map((p) => p.id) }
      : {}),
  }
}

function toPayload(
  config: RegionConfig,
  _existing?: LiveRegion
): Record<string, unknown> {
  return {
    name: config.name,
    currency_code: config.currency_code,
    countries: config.countries,
    automatic_taxes: config.automatic_taxes ?? true,
    ...(config.tax_rate != null ? { tax_rate: config.tax_rate } : {}),
    ...(config.payment_providers ? { payment_providers: config.payment_providers } : {}),
  }
}

export const regionsHandler: ResourceHandler<RegionConfig, LiveRegion> = {
  name: "regions",
  keyField: "name",

  async dump(client: CaliLeanClient): Promise<LiveRegion[]> {
    const res = await client.get<{ regions: LiveRegion[] }>("/regions?limit=50")
    return res.regions
  },

  toConfig,
  toPayload,

  getKey(config: RegionConfig): string {
    return config.name
  },

  getLiveKey(live: LiveRegion): string {
    return live.name
  },

  diffFields: ["name", "currency_code", "countries", "automatic_taxes"],
}
