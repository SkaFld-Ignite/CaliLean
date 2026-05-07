import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { writeConfig } from "../utils/yaml"
import { log, setVerbose } from "../utils/logger"
import { CaliLeanConfig, CategoryConfig } from "../schema/config"
import {
  dumpStore,
  regionsHandler,
  dumpCategories,
  dumpProducts,
  dumpShipping,
  dumpPromotions,
  dumpSalesChannels,
  dumpApiKeys,
  dumpInventory,
} from "../resources"

export function registerDumpCommand(program: Command): void {
  program
    .command("dump")
    .description("Dump live Medusa instance state to a config YAML file")
    .option("-o, --output <path>", "Output file path", "calilean.dump.yaml")
    .action(async (cmdOpts) => {
      const opts = program.opts()
      if (opts.verbose) setVerbose(true)

      const outputPath = cmdOpts.output as string

      // Authenticate
      const creds = await resolveAuth(opts)
      const client = new CaliLeanClient(creds)
      await client.authenticate()
      log.success("Authenticated")

      log.header("Dumping live state")

      // 1. Store
      log.info("Fetching store...")
      const store = await dumpStore(client)

      // 2. Regions
      log.info("Fetching regions...")
      const liveRegions = await regionsHandler.dump(client)
      const regions = liveRegions.map((r) => regionsHandler.toConfig(r))

      // 3. Categories
      log.info("Fetching categories...")
      const liveCategories = await dumpCategories(client)
      const categories = buildCategoryTree(liveCategories)

      // 4. Products
      log.info("Fetching products...")
      const liveProducts = await dumpProducts(client)
      const products = liveProducts.map((p) => ({
        title: p.title,
        handle: p.handle,
        ...(p.subtitle ? { subtitle: p.subtitle } : {}),
        ...(p.description ? { description: p.description } : {}),
        status: p.status as "draft" | "published" | "proposed" | "rejected" | undefined,
        ...(p.thumbnail ? { thumbnail: p.thumbnail } : {}),
        ...(p.categories?.length
          ? { categories: p.categories.map((c) => c.handle) }
          : {}),
        ...(p.metadata && Object.keys(p.metadata).length > 0
          ? { metadata: p.metadata }
          : {}),
        ...(p.options?.length
          ? {
              options: p.options.map((o) => ({
                title: o.title,
                values: o.values.map((v) => v.value),
              })),
            }
          : {}),
        variants: p.variants.map((v) => ({
          title: v.title,
          ...(v.sku ? { sku: v.sku } : {}),
          ...(v.options?.length
            ? {
                options: Object.fromEntries(
                  v.options.map((o) => [
                    o.option?.title ?? "unknown",
                    o.value,
                  ])
                ),
              }
            : {}),
          ...(v.prices?.length
            ? {
                prices: v.prices.map((pr) => ({
                  currency_code: pr.currency_code,
                  amount: pr.amount,
                })),
              }
            : {}),
        })),
      }))

      // 5. Shipping
      log.info("Fetching shipping...")
      const liveShipping = await dumpShipping(client)
      const shipping = {
        profiles: liveShipping.profiles.map((p) => ({
          name: p.name,
          type: p.type as "default" | "gift_card" | "custom",
        })),
        options: liveShipping.options.map((o) => ({
          name: o.name,
          region: o.region_id ?? "",
          provider: o.provider_id ?? "",
          price_type: o.price_type as "flat" | "calculated",
          ...(o.amount != null ? { amount: o.amount } : {}),
          ...(o.is_return ? { is_return: o.is_return } : {}),
          ...(o.admin_only ? { admin_only: o.admin_only } : {}),
        })),
      }

      // 6. Promotions
      log.info("Fetching promotions...")
      const livePromotions = await dumpPromotions(client)
      const promotions = livePromotions.map((p) => ({
        code: p.code,
        type: p.type as "standard" | "buyget",
        ...(p.is_automatic ? { is_automatic: p.is_automatic } : {}),
        ...(p.campaign ? { campaign: p.campaign } : {}),
        application_method: {
          type: (p.application_method?.type ?? "percentage") as "percentage" | "fixed",
          value: p.application_method?.value ?? 0,
          target_type: (p.application_method?.target_type ?? "order") as
            | "items"
            | "shipping"
            | "order",
          ...(p.application_method?.allocation
            ? { allocation: p.application_method.allocation as "each" | "across" }
            : {}),
          ...(p.application_method?.max_quantity != null
            ? { max_quantity: p.application_method.max_quantity }
            : {}),
          ...(p.application_method?.buy_rules_min_quantity != null
            ? { buy_rules_min_quantity: p.application_method.buy_rules_min_quantity }
            : {}),
        },
      }))

      // 7. Sales Channels
      log.info("Fetching sales channels...")
      const liveSalesChannels = await dumpSalesChannels(client)
      const salesChannels = liveSalesChannels.map((sc) => ({
        name: sc.name,
        ...(sc.description ? { description: sc.description } : {}),
        ...(sc.is_disabled ? { is_disabled: sc.is_disabled } : {}),
      }))

      // 8. API Keys
      log.info("Fetching API keys...")
      const liveApiKeys = await dumpApiKeys(client)
      const apiKeys = liveApiKeys.map((k) => ({
        title: k.title,
        type: k.type as "publishable" | "secret",
      }))

      // 9. Inventory
      log.info("Fetching inventory locations...")
      const liveLocations = await dumpInventory(client)
      const inventory = {
        locations: liveLocations.map((loc) => ({
          name: loc.name,
          address: {
            address_1: loc.address?.address_1,
            address_2: loc.address?.address_2,
            city: loc.address?.city,
            province: loc.address?.province,
            postal_code: loc.address?.postal_code,
            country_code: loc.address?.country_code ?? "us",
            phone: loc.address?.phone,
            company: loc.address?.company,
          },
        })),
      }

      // Build the full config
      const config: CaliLeanConfig = {
        store,
        ...(regions.length > 0 ? { regions } : {}),
        ...(categories.length > 0 ? { categories } : {}),
        ...(products.length > 0 ? { products } : {}),
        ...(shipping.profiles.length > 0 || shipping.options.length > 0
          ? { shipping }
          : {}),
        ...(promotions.length > 0 ? { promotions } : {}),
        ...(salesChannels.length > 0 ? { sales_channels: salesChannels } : {}),
        ...(apiKeys.length > 0 ? { api_keys: apiKeys } : {}),
        ...(inventory.locations.length > 0 ? { inventory } : {}),
      }

      writeConfig(outputPath, config)
      log.header("Done")
      log.info(
        `Dumped: ${regions.length} regions, ${categories.length} categories (top-level), ` +
          `${products.length} products, ${promotions.length} promotions, ` +
          `${salesChannels.length} sales channels, ${apiKeys.length} API keys, ` +
          `${inventory.locations.length} locations`
      )
    })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface FlatCategory {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
}

function buildCategoryTree(flat: FlatCategory[]): CategoryConfig[] {
  // Group children by parent
  const childrenOf = new Map<string | null, FlatCategory[]>()
  for (const cat of flat) {
    const parentKey = cat.parent_category_id ?? null
    if (!childrenOf.has(parentKey)) {
      childrenOf.set(parentKey, [])
    }
    childrenOf.get(parentKey)!.push(cat)
  }

  function buildLevel(parentId: string | null): CategoryConfig[] {
    const items = childrenOf.get(parentId) ?? []
    return items.map((cat) => {
      const children = buildLevel(cat.id)
      return {
        name: cat.name,
        handle: cat.handle,
        ...(children.length > 0 ? { children } : {}),
      }
    })
  }

  return buildLevel(null)
}
