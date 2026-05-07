import { CaliLeanClient } from "../client"
import { ProductConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

// ── API response shapes ───────────────────────────────────────────────────

interface LivePrice {
  currency_code: string
  amount: number
}

interface LiveOptionValue {
  value: string
}

interface LiveOption {
  id: string
  title: string
  values: LiveOptionValue[]
}

interface LiveVariant {
  id: string
  title: string
  sku?: string
  prices: LivePrice[]
  options?: Record<string, string>
}

interface LiveCategory {
  id: string
  handle: string
}

interface LiveProduct {
  id: string
  title: string
  handle: string
  status: string
  description?: string
  subtitle?: string
  thumbnail?: string
  categories?: LiveCategory[]
  options?: LiveOption[]
  variants: LiveVariant[]
  metadata?: Record<string, unknown>
}

interface LiveSalesChannel {
  id: string
  name: string
  is_disabled: boolean
}

// ── Dump ──────────────────────────────────────────────────────────────────

export async function dumpProducts(client: CaliLeanClient): Promise<LiveProduct[]> {
  const products: LiveProduct[] = []
  let offset = 0
  const limit = 50
  const fields =
    "*variants,*variants.prices,*options,*options.values,*categories"

  while (true) {
    const res = await client.get<{ products: LiveProduct[]; count: number }>(
      `/products?limit=${limit}&offset=${offset}&fields=${fields}`
    )
    products.push(...res.products)
    if (products.length >= res.count || res.products.length < limit) break
    offset += limit
  }

  verbose(`Fetched ${products.length} products`)
  return products
}

// ── Sync ──────────────────────────────────────────────────────────────────

export async function syncProducts(
  client: CaliLeanClient,
  configs: ProductConfig[],
  categoryMap: Map<string, string>,
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose(`Syncing products: ${configs.length} entries`)

  // Fetch live products
  const liveProducts = await dumpProducts(client)
  const liveByHandle = new Map<string, LiveProduct>()
  for (const p of liveProducts) {
    liveByHandle.set(p.handle, p)
  }

  // Fetch default sales channel
  const defaultSalesChannelId = await getDefaultSalesChannel(client)

  // Track managed handles so we can flag unmanaged
  const managedHandles = new Set<string>()

  for (const config of configs) {
    managedHandles.add(config.handle)
    const existing = liveByHandle.get(config.handle)

    if (existing) {
      // Product exists — skip (variant updates are complex)
      log.skip("products", config.handle)
      result.skipped++
      continue
    }

    // CREATE
    verbose(`products/${config.handle}: not found, creating`)

    // Resolve category handles to IDs
    const categoryIds: string[] = []
    if (config.categories) {
      for (const handle of config.categories) {
        const id = categoryMap.get(handle)
        if (id) {
          categoryIds.push(id)
        } else {
          log.warn(`products/${config.handle}: category "${handle}" not found — skipping category`)
        }
      }
    }

    if (!dryRun) {
      try {
        const payload = buildCreatePayload(config, categoryIds, defaultSalesChannelId)
        await client.post("/products", payload)
        log.create("products", config.handle)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`products/${config.handle}: ${message}`)
        continue
      }
    } else {
      log.create("products", config.handle)
    }
    result.created++
  }

  // Flag unmanaged products
  for (const [handle] of liveByHandle) {
    if (!managedHandles.has(handle)) {
      log.unmanaged("products", handle)
    }
  }

  return result
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function getDefaultSalesChannel(client: CaliLeanClient): Promise<string | null> {
  try {
    const res = await client.get<{ sales_channels: LiveSalesChannel[] }>(
      "/sales-channels?limit=1"
    )
    if (res.sales_channels.length > 0) {
      verbose(`Using default sales channel: ${res.sales_channels[0].name}`)
      return res.sales_channels[0].id
    }
  } catch {
    verbose("Could not fetch sales channels")
  }
  return null
}

function buildCreatePayload(
  config: ProductConfig,
  categoryIds: string[],
  salesChannelId: string | null
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: config.title,
    handle: config.handle,
    status: config.status ?? "draft",
  }

  if (config.subtitle) payload.subtitle = config.subtitle
  if (config.description) payload.description = config.description
  if (config.thumbnail) payload.thumbnail = config.thumbnail
  if (config.images) payload.images = config.images.map((url) => ({ url }))
  if (config.weight != null) payload.weight = config.weight
  if (config.length != null) payload.length = config.length
  if (config.height != null) payload.height = config.height
  if (config.width != null) payload.width = config.width
  if (config.hs_code) payload.hs_code = config.hs_code
  if (config.origin_country) payload.origin_country = config.origin_country
  if (config.mid_code) payload.mid_code = config.mid_code
  if (config.material) payload.material = config.material
  if (config.metadata) payload.metadata = config.metadata

  if (categoryIds.length > 0) {
    payload.categories = categoryIds.map((id) => ({ id }))
  }

  if (salesChannelId) {
    payload.sales_channels = [{ id: salesChannelId }]
  }

  // Options
  if (config.options && config.options.length > 0) {
    payload.options = config.options.map((opt) => ({
      title: opt.title,
      values: opt.values,
    }))
  }

  // Variants
  payload.variants = config.variants.map((v) => {
    const variant: Record<string, unknown> = { title: v.title }
    if (v.sku) variant.sku = v.sku
    if (v.barcode) variant.barcode = v.barcode
    if (v.ean) variant.ean = v.ean
    if (v.upc) variant.upc = v.upc
    if (v.manage_inventory != null) variant.manage_inventory = v.manage_inventory
    if (v.allow_backorder != null) variant.allow_backorder = v.allow_backorder
    if (v.weight != null) variant.weight = v.weight
    if (v.length != null) variant.length = v.length
    if (v.height != null) variant.height = v.height
    if (v.width != null) variant.width = v.width
    if (v.options) variant.options = v.options
    if (v.prices) {
      variant.prices = v.prices.map((p) => ({
        currency_code: p.currency_code,
        amount: p.amount,
        ...(p.min_quantity != null ? { min_quantity: p.min_quantity } : {}),
        ...(p.max_quantity != null ? { max_quantity: p.max_quantity } : {}),
      }))
    }
    return variant
  })

  return payload
}
