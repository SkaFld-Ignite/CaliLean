import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { loadConfig } from "../utils/yaml"
import { log, setVerbose } from "../utils/logger"
import { syncResource } from "../engine/sync"
import {
  syncStore,
  regionsHandler,
  syncCategories,
  dumpCategories,
  syncShipping,
  syncTax,
  syncProducts,
  syncSalesChannels,
  dumpSalesChannels,
  syncApiKeys,
  syncPromotions,
  syncInventory,
} from "../resources"

export function registerDiffCommand(program: Command): void {
  program
    .command("diff")
    .description("Show what would change without applying (dry-run mode)")
    .action(async () => {
      const opts = program.opts()
      if (opts.verbose) setVerbose(true)

      log.info("DIFF MODE — showing what would change (no mutations)")

      // Load config
      const config = loadConfig(opts.config)
      log.success(`Config loaded from ${opts.config}`)

      // Authenticate
      const creds = await resolveAuth(opts)
      const client = new CaliLeanClient(creds)
      await client.authenticate()
      log.success("Authenticated")

      const totals = { created: 0, updated: 0, skipped: 0, errors: 0 }

      function accum(r: { created: number; updated: number; skipped: number }) {
        totals.created += r.created
        totals.updated += r.updated
        totals.skipped += r.skipped
      }

      // All sync calls run in dry-run mode
      const dryRun = true

      // 1. Store
      log.header("Store")
      accum(await syncStore(client, config.store, dryRun))

      // 2. Regions
      if (config.regions?.length) {
        log.header("Regions")
        const result = await syncResource(client, regionsHandler, config.regions, dryRun)
        totals.created += result.created
        totals.updated += result.updated
        totals.skipped += result.skipped
        totals.errors += result.errors.length
      }

      // 3. Categories
      if (config.categories?.length) {
        log.header("Categories")
        accum(await syncCategories(client, config.categories, dryRun))
      }

      // 4. Shipping
      if (config.shipping) {
        log.header("Shipping")
        accum(await syncShipping(client, config.shipping, dryRun))
      }

      // 5. Tax
      log.header("Tax")
      accum(await syncTax())

      // 6. Products
      if (config.products?.length) {
        log.header("Products")
        const liveCats = await dumpCategories(client)
        const categoryMap = new Map<string, string>()
        for (const cat of liveCats) {
          categoryMap.set(cat.handle, cat.id)
        }
        accum(await syncProducts(client, config.products, categoryMap, dryRun))
      }

      // 7. Sales Channels
      if (config.sales_channels?.length) {
        log.header("Sales Channels")
        accum(await syncSalesChannels(client, config.sales_channels, dryRun))
      }

      // 8. API Keys
      if (config.api_keys?.length) {
        log.header("API Keys")
        const liveSC = await dumpSalesChannels(client)
        const salesChannelMap = new Map<string, string>()
        for (const sc of liveSC) {
          salesChannelMap.set(sc.name, sc.id)
        }
        accum(await syncApiKeys(client, config.api_keys, salesChannelMap, dryRun))
      }

      // 9. Promotions
      if (config.promotions?.length) {
        log.header("Promotions")
        accum(await syncPromotions(client, config.promotions, dryRun))
      }

      // 10. Inventory
      if (config.inventory?.locations?.length) {
        log.header("Inventory")
        accum(await syncInventory(client, config.inventory.locations, dryRun))
      }

      // Summary
      log.header("Diff Summary")
      log.info(
        `Would create: ${totals.created}  Would update: ${totals.updated}  In sync: ${totals.skipped}  Errors: ${totals.errors}`
      )
    })
}
