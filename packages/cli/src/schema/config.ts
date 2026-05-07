import { z } from "zod"

// ── Store ──────────────────────────────────────────────────────────────────

const StoreSchema = z.object({
  name: z.string(),
  default_currency: z.string(),
  supported_currencies: z.array(z.string()).min(1),
})

// ── Regions ────────────────────────────────────────────────────────────────

const RegionSchema = z.object({
  name: z.string(),
  currency_code: z.string(),
  countries: z.array(z.string()),
  automatic_taxes: z.boolean().optional(),
  tax_rate: z.number().optional(),
  payment_providers: z.array(z.string()).optional(),
})

// ── Categories ─────────────────────────────────────────────────────────────

const CategoryChildSchema = z.object({
  name: z.string(),
  handle: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_internal: z.boolean().optional(),
})

const CategorySchema: z.ZodType<{
  name: string
  handle: string
  description?: string
  is_active?: boolean
  is_internal?: boolean
  children?: Array<{
    name: string
    handle: string
    description?: string
    is_active?: boolean
    is_internal?: boolean
    children?: unknown[]
  }>
}> = z.object({
  name: z.string(),
  handle: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_internal: z.boolean().optional(),
  children: z.lazy(() => z.array(CategorySchema)).optional(),
})

// ── Products ───────────────────────────────────────────────────────────────

const ProductStatusEnum = z.enum(["draft", "published", "proposed", "rejected"])

const PriceSchema = z.object({
  currency_code: z.string(),
  amount: z.number(),
  min_quantity: z.number().optional(),
  max_quantity: z.number().optional(),
})

const PriceTierSchema = z.object({
  currency_code: z.string(),
  amount: z.number(),
  min_quantity: z.number(),
  max_quantity: z.number().optional(),
})

const VariantSchema = z.object({
  title: z.string(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  options: z.record(z.string()).optional(),
  manage_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  weight: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  prices: z.array(PriceSchema).optional(),
  price_tiers: z.array(PriceTierSchema).optional(),
})

const ProductOptionSchema = z.object({
  title: z.string(),
  values: z.array(z.string()),
})

const ProductSchema = z.object({
  title: z.string(),
  handle: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  status: ProductStatusEnum.optional(),
  thumbnail: z.string().optional(),
  images: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  collection: z.string().optional(),
  type: z.string().optional(),
  weight: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  mid_code: z.string().optional(),
  material: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  options: z.array(ProductOptionSchema).optional(),
  variants: z.array(VariantSchema),
})

// ── Shipping ───────────────────────────────────────────────────────────────

const ShippingProfileTypeEnum = z.enum(["default", "gift_card", "custom"])
const ShippingPriceTypeEnum = z.enum(["flat", "calculated"])

const ShippingProfileSchema = z.object({
  name: z.string(),
  type: ShippingProfileTypeEnum,
})

const ShippingOptionSchema = z.object({
  name: z.string(),
  region: z.string(),
  provider: z.string(),
  price_type: ShippingPriceTypeEnum,
  amount: z.number().optional(),
  is_return: z.boolean().optional(),
  admin_only: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const ShippingSchema = z.object({
  profiles: z.array(ShippingProfileSchema).optional(),
  options: z.array(ShippingOptionSchema).optional(),
})

// ── Promotions ─────────────────────────────────────────────────────────────

const PromotionTypeEnum = z.enum(["standard", "buyget"])
const PromotionMethodTypeEnum = z.enum(["percentage", "fixed"])
const PromotionAllocationEnum = z.enum(["each", "across"])
const PromotionTargetTypeEnum = z.enum(["items", "shipping", "order"])

const ApplicationMethodSchema = z.object({
  type: PromotionMethodTypeEnum,
  value: z.number(),
  allocation: PromotionAllocationEnum.optional(),
  target_type: PromotionTargetTypeEnum,
  max_quantity: z.number().optional(),
  buy_rules_min_quantity: z.number().optional(),
})

const PromotionSchema = z.object({
  code: z.string(),
  type: PromotionTypeEnum,
  is_automatic: z.boolean().optional(),
  campaign: z.string().optional(),
  application_method: ApplicationMethodSchema,
})

// ── Sales Channels ─────────────────────────────────────────────────────────

const SalesChannelSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_disabled: z.boolean().optional(),
  products: z.union([z.literal("all"), z.array(z.string())]).optional(),
})

// ── API Keys ───────────────────────────────────────────────────────────────

const ApiKeyTypeEnum = z.enum(["publishable", "secret"])

const ApiKeySchema = z.object({
  title: z.string(),
  type: ApiKeyTypeEnum,
  sales_channels: z.array(z.string()).optional(),
})

// ── Inventory ──────────────────────────────────────────────────────────────

const AddressSchema = z.object({
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z.string(),
  phone: z.string().optional(),
  company: z.string().optional(),
})

const InventoryLocationSchema = z.object({
  name: z.string(),
  address: AddressSchema,
})

const InventorySchema = z.object({
  locations: z.array(InventoryLocationSchema),
})

// ── Root Config ────────────────────────────────────────────────────────────

export const CaliLeanConfigSchema = z.object({
  store: StoreSchema,
  regions: z.array(RegionSchema).optional(),
  categories: z.array(CategorySchema).optional(),
  products: z.array(ProductSchema).optional(),
  shipping: ShippingSchema.optional(),
  promotions: z.array(PromotionSchema).optional(),
  sales_channels: z.array(SalesChannelSchema).optional(),
  api_keys: z.array(ApiKeySchema).optional(),
  inventory: InventorySchema.optional(),
})

// ── Inferred Types ─────────────────────────────────────────────────────────

export type CaliLeanConfig = z.infer<typeof CaliLeanConfigSchema>
export type ProductConfig = z.infer<typeof ProductSchema>
export type RegionConfig = z.infer<typeof RegionSchema>
export type CategoryConfig = z.infer<typeof CategorySchema>
export type PromotionConfig = z.infer<typeof PromotionSchema>
export type ShippingOptionConfig = z.infer<typeof ShippingOptionSchema>
export type SalesChannelConfig = z.infer<typeof SalesChannelSchema>
export type ApiKeyConfig = z.infer<typeof ApiKeySchema>
export type InventoryLocationConfig = z.infer<typeof InventoryLocationSchema>
export type InventoryConfig = z.infer<typeof InventorySchema>
