import { CaliLeanClient } from "../client"
import { CategoryConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

interface LiveCategory {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
  description?: string
  is_active?: boolean
  is_internal?: boolean
}

interface CategoryDump {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
}

export async function dumpCategories(client: CaliLeanClient): Promise<CategoryDump[]> {
  const res = await client.get<{ product_categories: LiveCategory[] }>(
    "/product-categories?limit=100"
  )
  return res.product_categories.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    parent_category_id: c.parent_category_id,
  }))
}

export async function syncCategories(
  client: CaliLeanClient,
  configs: CategoryConfig[],
  dryRun: boolean = false
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 }

  verbose(`Syncing categories: ${configs.length} top-level entries`)

  // Fetch all live categories
  const res = await client.get<{ product_categories: LiveCategory[] }>(
    "/product-categories?limit=100"
  )
  const liveCategories = res.product_categories
  const liveByHandle = new Map<string, LiveCategory>()
  for (const cat of liveCategories) {
    liveByHandle.set(cat.handle, cat)
  }

  // Process each top-level config category, then its children
  for (const config of configs) {
    const parentId = await syncSingleCategory(
      client,
      config,
      null,
      liveByHandle,
      dryRun,
      result
    )

    // Sync children if present
    if (config.children && parentId) {
      for (const child of config.children) {
        await syncSingleCategory(
          client,
          child as CategoryConfig,
          parentId,
          liveByHandle,
          dryRun,
          result
        )
      }
    }
  }

  return result
}

async function syncSingleCategory(
  client: CaliLeanClient,
  config: CategoryConfig,
  parentId: string | null,
  liveByHandle: Map<string, LiveCategory>,
  dryRun: boolean,
  result: { created: number; updated: number; skipped: number }
): Promise<string | null> {
  const existing = liveByHandle.get(config.handle)

  if (!existing) {
    // CREATE
    verbose(`categories/${config.handle}: not found, creating`)
    if (!dryRun) {
      const payload: Record<string, unknown> = {
        name: config.name,
        handle: config.handle,
        ...(config.description ? { description: config.description } : {}),
        ...(config.is_active != null ? { is_active: config.is_active } : {}),
        ...(config.is_internal != null ? { is_internal: config.is_internal } : {}),
        ...(parentId ? { parent_category_id: parentId } : {}),
      }
      try {
        const created = await client.post<{ product_category: LiveCategory }>(
          "/product-categories",
          payload
        )
        const newCat = created.product_category
        liveByHandle.set(newCat.handle, newCat)
        log.create("categories", config.handle)
        result.created++
        return newCat.id
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`categories/${config.handle}: ${message}`)
        return null
      }
    } else {
      log.create("categories", config.handle)
      result.created++
      return `dry-run-${config.handle}`
    }
  }

  // EXISTS — check if update needed
  const needsUpdate =
    existing.name !== config.name ||
    (config.description != null && existing.description !== config.description) ||
    (config.is_active != null && existing.is_active !== config.is_active) ||
    (config.is_internal != null && existing.is_internal !== config.is_internal) ||
    (parentId != null && existing.parent_category_id !== parentId)

  if (!needsUpdate) {
    log.skip("categories", config.handle)
    result.skipped++
    return existing.id
  }

  verbose(`categories/${config.handle}: needs update`)
  if (!dryRun) {
    const payload: Record<string, unknown> = {
      name: config.name,
      ...(config.description != null ? { description: config.description } : {}),
      ...(config.is_active != null ? { is_active: config.is_active } : {}),
      ...(config.is_internal != null ? { is_internal: config.is_internal } : {}),
      ...(parentId ? { parent_category_id: parentId } : {}),
    }
    try {
      await client.post(`/product-categories/${existing.id}`, payload)
      log.update("categories", config.handle)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log.error(`categories/${config.handle}: ${message}`)
      return existing.id
    }
  } else {
    log.update("categories", config.handle)
  }
  result.updated++
  return existing.id
}
