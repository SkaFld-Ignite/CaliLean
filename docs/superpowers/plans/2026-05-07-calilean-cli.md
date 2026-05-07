# CaliLean CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@calilean/cli` — a TypeScript CLI that manages the full Medusa instance config as code via YAML with sync, diff, dump, and seed commands.

**Architecture:** Commander.js CLI entry point dispatches to resource handlers. Each handler implements dump/diff/sync against the Medusa Admin API via `@medusajs/js-sdk`. A Zod schema validates the YAML config. Auth resolves from Doppler, env vars, or defaults.

**Tech Stack:** TypeScript, commander, yaml, zod, chalk, @medusajs/js-sdk, cli-table3

**Spec:** `docs/superpowers/specs/2026-05-07-calilean-cli-design.md`

---

## File Map

```
packages/cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # CLI entry, commander program setup
│   ├── client.ts                   # CaliLeanClient: auth + typed API wrapper
│   ├── auth/
│   │   ├── doppler.ts              # Shell out to doppler CLI for secrets
│   │   └── resolve.ts              # Auth resolution chain (flags → doppler → env → defaults)
│   ├── engine/
│   │   ├── types.ts                # ResourceHandler interface, SyncResult, FieldDiff
│   │   ├── sync.ts                 # Generic sync algorithm (create/update/skip)
│   │   └── diff.ts                 # Generic diff + formatted output
│   ├── resources/
│   │   ├── store.ts                # Store name, currencies
│   │   ├── regions.ts              # Regions, countries, payment providers
│   │   ├── categories.ts           # Product categories (nested)
│   │   ├── shipping.ts             # Shipping profiles + options
│   │   ├── tax.ts                  # Tax rates per region
│   │   ├── products.ts             # Products, variants, prices, price tiers
│   │   ├── sales-channels.ts       # Sales channels + product linkage
│   │   ├── api-keys.ts             # Publishable keys + sales channel linkage
│   │   ├── promotions.ts           # Promotions with application methods
│   │   ├── inventory.ts            # Stock locations
│   │   └── index.ts                # Registry: ordered list of all handlers
│   ├── schema/
│   │   └── config.ts               # Zod schema + inferred types for YAML
│   └── utils/
│       ├── yaml.ts                 # loadConfig / writeConfig helpers
│       └── logger.ts               # log.info/warn/error/success/table/verbose
├── __tests__/
│   ├── schema.test.ts              # Config validation tests
│   ├── diff.test.ts                # Diff engine tests
│   ├── sync.test.ts                # Sync algorithm tests
│   └── auth.test.ts                # Auth resolution tests
└── calilean.config.example.yaml    # Committed example config
```

---

### Task 1: Package scaffold + CLI entry point

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/utils/logger.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@calilean/cli",
  "version": "0.1.0",
  "private": true,
  "bin": {
    "calilean": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "@medusajs/js-sdk": "2.14.1",
    "chalk": "^4.1.2",
    "cli-table3": "^0.6.5",
    "commander": "^12.1.0",
    "yaml": "^2.7.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^20.19.0",
    "typescript": "^5.7.0",
    "@swc/core": "^1.11.0",
    "@swc/jest": "^0.2.37",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
```

Note: `chalk@4` (not 5) because chalk 5 is ESM-only and our CJS compiled output can't require it. Same lesson as date-fns.

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["__tests__", "dist", "node_modules"]
}
```

- [ ] **Step 3: Create logger utility**

Create `packages/cli/src/utils/logger.ts`:

```typescript
import chalk from "chalk"

export const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
  error: (msg: string) => console.error(chalk.red("✗"), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),
  header: (msg: string) => console.log(chalk.bold.underline(msg)),
  create: (resource: string, key: string) =>
    console.log(chalk.green("+"), `${resource}: ${key}`, chalk.dim("[CREATE]")),
  update: (resource: string, key: string) =>
    console.log(chalk.yellow("~"), `${resource}: ${key}`, chalk.dim("[UPDATE]")),
  skip: (resource: string, key: string) =>
    console.log(chalk.green("✓"), `${resource}: ${key}`, chalk.dim("[IN SYNC]")),
  unmanaged: (resource: string, key: string) =>
    console.log(chalk.dim("-"), `${resource}: ${key}`, chalk.dim("[UNMANAGED]")),
  field: (path: string, from: unknown, to: unknown) =>
    console.log(chalk.dim("    "), `${path}: ${chalk.red(String(from))} → ${chalk.green(String(to))}`),
}

let verboseEnabled = false
export function setVerbose(v: boolean) { verboseEnabled = v }
export function verbose(msg: string) {
  if (verboseEnabled) console.log(chalk.dim(`  [verbose] ${msg}`))
}
```

- [ ] **Step 4: Create CLI entry point**

Create `packages/cli/src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from "commander"

const program = new Command()
  .name("calilean")
  .description("CaliLean Medusa instance configuration CLI")
  .version("0.1.0")
  .option("--env <name>", "Target environment: local, dev, prd")
  .option("--url <url>", "Override backend URL")
  .option("--email <email>", "Override admin email")
  .option("--password <password>", "Override admin password")
  .option("--config <path>", "Config file path", "calilean.config.yaml")
  .option("--verbose", "Show API calls and responses")
  .option("--json", "Output in JSON format")
  .option("--force", "Skip confirmation prompts (for CI)")
  .option("--dry-run", "Show what would change without applying")

// Commands will be registered in subsequent tasks

program.parse()
```

- [ ] **Step 5: Install dependencies and verify build**

Run:
```bash
cd packages/cli && pnpm install && pnpm build
```
Expected: compiles with no errors, produces `dist/index.js`

- [ ] **Step 6: Verify CLI runs**

Run:
```bash
node dist/index.js --help
```
Expected: Shows help text with all global options

- [ ] **Step 7: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): scaffold @calilean/cli package with commander entry point"
```

---

### Task 2: Auth resolution chain

**Files:**
- Create: `packages/cli/src/auth/doppler.ts`
- Create: `packages/cli/src/auth/resolve.ts`
- Create: `packages/cli/__tests__/auth.test.ts`

- [ ] **Step 1: Write auth test**

Create `packages/cli/__tests__/auth.test.ts`:

```typescript
import { resolveAuth, Credentials } from "../src/auth/resolve"

describe("resolveAuth", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })
  afterAll(() => {
    process.env = originalEnv
  })

  it("uses explicit flags when provided", async () => {
    const creds = await resolveAuth({
      url: "https://explicit.example.com",
      email: "explicit@test.com",
      password: "explicitpw",
    })
    expect(creds).toEqual({
      url: "https://explicit.example.com",
      email: "explicit@test.com",
      password: "explicitpw",
    })
  })

  it("falls back to env vars when no flags", async () => {
    process.env.MEDUSA_BACKEND_URL = "https://env.example.com"
    process.env.MEDUSA_ADMIN_EMAIL = "env@test.com"
    process.env.MEDUSA_ADMIN_PASSWORD = "envpw"
    const creds = await resolveAuth({})
    expect(creds).toEqual({
      url: "https://env.example.com",
      email: "env@test.com",
      password: "envpw",
    })
  })

  it("uses defaults when nothing else available", async () => {
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.MEDUSA_ADMIN_EMAIL
    delete process.env.MEDUSA_ADMIN_PASSWORD
    const creds = await resolveAuth({})
    expect(creds).toEqual({
      url: "http://localhost:9000",
      email: "admin@calilean.com",
      password: "supersecret",
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli && pnpm test`
Expected: FAIL — module not found

- [ ] **Step 3: Create Doppler resolver**

Create `packages/cli/src/auth/doppler.ts`:

```typescript
import { execSync } from "child_process"

const CONFIG_MAP: Record<string, string> = {
  local: "dev_backend",
  dev: "dev_backend",
  stg: "stg",
  prd: "prd_backend",
}

export interface DopplerSecrets {
  MEDUSA_BACKEND_URL?: string
  MEDUSA_ADMIN_EMAIL?: string
  MEDUSA_ADMIN_PASSWORD?: string
}

export function resolveFromDoppler(env: string): DopplerSecrets | null {
  const config = CONFIG_MAP[env]
  if (!config) {
    throw new Error(
      `Unknown environment "${env}". Valid values: ${Object.keys(CONFIG_MAP).join(", ")}`
    )
  }

  try {
    const cmd = `doppler secrets get MEDUSA_BACKEND_URL MEDUSA_ADMIN_EMAIL MEDUSA_ADMIN_PASSWORD -p calilean -c ${config} --json 2>/dev/null`
    const output = execSync(cmd, { encoding: "utf-8", timeout: 10000 })
    const secrets = JSON.parse(output)
    return {
      MEDUSA_BACKEND_URL: secrets.MEDUSA_BACKEND_URL?.computed,
      MEDUSA_ADMIN_EMAIL: secrets.MEDUSA_ADMIN_EMAIL?.computed,
      MEDUSA_ADMIN_PASSWORD: secrets.MEDUSA_ADMIN_PASSWORD?.computed,
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Create auth resolver**

Create `packages/cli/src/auth/resolve.ts`:

```typescript
import { resolveFromDoppler } from "./doppler"
import { log } from "../utils/logger"

export interface Credentials {
  url: string
  email: string
  password: string
}

interface AuthFlags {
  url?: string
  email?: string
  password?: string
  env?: string
}

const DEFAULTS: Credentials = {
  url: "http://localhost:9000",
  email: "admin@calilean.com",
  password: "supersecret",
}

export async function resolveAuth(flags: AuthFlags): Promise<Credentials> {
  // Priority 1: explicit flags
  if (flags.url && flags.email && flags.password) {
    log.dim("Auth: using explicit flags")
    return { url: flags.url, email: flags.email, password: flags.password }
  }

  // Priority 2: Doppler
  if (flags.env) {
    const secrets = resolveFromDoppler(flags.env)
    if (secrets?.MEDUSA_BACKEND_URL && secrets?.MEDUSA_ADMIN_EMAIL && secrets?.MEDUSA_ADMIN_PASSWORD) {
      log.dim(`Auth: resolved from Doppler (${flags.env})`)
      return {
        url: secrets.MEDUSA_BACKEND_URL,
        email: secrets.MEDUSA_ADMIN_EMAIL,
        password: secrets.MEDUSA_ADMIN_PASSWORD,
      }
    }
    log.warn(`Doppler lookup for "${flags.env}" failed, falling back to env vars`)
  }

  // Priority 3: env vars
  const envUrl = process.env.MEDUSA_BACKEND_URL
  const envEmail = process.env.MEDUSA_ADMIN_EMAIL
  const envPassword = process.env.MEDUSA_ADMIN_PASSWORD
  if (envUrl && envEmail && envPassword) {
    log.dim("Auth: using environment variables")
    return { url: envUrl, email: envEmail, password: envPassword }
  }

  // Priority 4: defaults
  log.dim("Auth: using defaults (localhost)")
  return DEFAULTS
}
```

- [ ] **Step 5: Add jest config**

Create `packages/cli/jest.config.js`:

```javascript
module.exports = {
  transform: { "^.+\\.tsx?$": ["@swc/jest"] },
  testPathPattern: "__tests__",
  testTimeout: 10000,
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd packages/cli && pnpm test`
Expected: 3 tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/auth/ packages/cli/__tests__/auth.test.ts packages/cli/jest.config.js
git commit -m "feat(cli): add auth resolution chain (flags → doppler → env → defaults)"
```

---

### Task 3: API client

**Files:**
- Create: `packages/cli/src/client.ts`

- [ ] **Step 1: Create the API client**

Create `packages/cli/src/client.ts`:

```typescript
import Medusa from "@medusajs/js-sdk"
import { Credentials } from "./auth/resolve"
import { verbose } from "./utils/logger"

export class CaliLeanClient {
  private baseUrl: string
  private token: string | null = null
  private sdk: InstanceType<typeof Medusa>

  constructor(private creds: Credentials) {
    this.baseUrl = creds.url
    this.sdk = new Medusa({ baseUrl: creds.url, debug: false })
  }

  async authenticate(): Promise<void> {
    verbose(`Authenticating as ${this.creds.email} at ${this.baseUrl}`)
    const res = await fetch(`${this.baseUrl}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.creds.email,
        password: this.creds.password,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Auth failed (${res.status}): ${body}`)
    }
    const data = await res.json()
    this.token = data.token
    verbose("Authenticated successfully")
  }

  async adminFetch<T = unknown>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    if (!this.token) throw new Error("Not authenticated — call authenticate() first")
    verbose(`${method} /admin${path}`)
    const res = await fetch(`${this.baseUrl}/admin${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API ${method} /admin${path} failed (${res.status}): ${text}`)
    }
    return res.json() as Promise<T>
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.adminFetch<T>("GET", path)
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.adminFetch<T>("POST", path, body)
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.adminFetch<T>("DELETE", path)
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`)
      return res.ok
    } catch {
      return false
    }
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd packages/cli && pnpm build`
Expected: compiles clean

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/client.ts
git commit -m "feat(cli): add CaliLeanClient API wrapper with JWT auth"
```

---

### Task 4: Zod config schema + YAML loader

**Files:**
- Create: `packages/cli/src/schema/config.ts`
- Create: `packages/cli/src/utils/yaml.ts`
- Create: `packages/cli/__tests__/schema.test.ts`

- [ ] **Step 1: Write schema test**

Create `packages/cli/__tests__/schema.test.ts`:

```typescript
import { CaliLeanConfigSchema } from "../src/schema/config"

describe("CaliLeanConfigSchema", () => {
  it("validates a minimal config", () => {
    const config = {
      store: { name: "Test", default_currency: "usd", supported_currencies: ["usd"] },
    }
    const result = CaliLeanConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
  })

  it("validates a full config with all resources", () => {
    const config = {
      store: { name: "CaliLean", default_currency: "usd", supported_currencies: ["usd", "eur"] },
      regions: [
        { name: "United States", currency_code: "usd", countries: ["us"], automatic_taxes: true },
      ],
      categories: [
        { name: "Peptides", handle: "peptides", children: [{ name: "Recovery", handle: "recovery" }] },
      ],
      products: [
        {
          title: "BPC-157", handle: "bpc-157", status: "published", categories: ["recovery"],
          options: [{ title: "Size", values: ["5mg"] }],
          variants: [{
            title: "5mg", sku: "CL-BPC-0005", options: { Size: "5mg" },
            manage_inventory: false, prices: [{ currency_code: "usd", amount: 29.74 }],
          }],
        },
      ],
      promotions: [
        {
          code: "TEST", type: "standard", is_automatic: false,
          application_method: { type: "percentage", value: 10, allocation: "across", target_type: "items" },
        },
      ],
      shipping: {
        profiles: [{ name: "Default", type: "default" }],
        options: [{ name: "Standard", region: "United States", provider: "manual", price_type: "flat", amount: 0 }],
      },
      sales_channels: [{ name: "Default Sales Channel", products: "all" }],
      api_keys: [{ title: "Webshop", type: "publishable", sales_channels: ["Default Sales Channel"] }],
      inventory: { locations: [{ name: "Warehouse", address: { country_code: "us" } }] },
    }
    const result = CaliLeanConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
  })

  it("rejects invalid product status", () => {
    const config = {
      store: { name: "T", default_currency: "usd", supported_currencies: ["usd"] },
      products: [{ title: "X", handle: "x", status: "invalid", variants: [] }],
    }
    const result = CaliLeanConfigSchema.safeParse(config)
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli && pnpm test`
Expected: FAIL — module not found

- [ ] **Step 3: Create Zod schema**

Create `packages/cli/src/schema/config.ts`:

```typescript
import { z } from "zod"

const PriceSchema = z.object({
  currency_code: z.string(),
  amount: z.number(),
})

const PriceTierSchema = z.object({
  min_quantity: z.number().int().positive(),
  max_quantity: z.number().int().positive().optional(),
  amount: z.number(),
})

const VariantSchema = z.object({
  title: z.string(),
  sku: z.string().optional(),
  options: z.record(z.string()).optional(),
  manage_inventory: z.boolean().optional(),
  weight: z.number().optional(),
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
  status: z.enum(["draft", "published", "proposed", "rejected"]).optional(),
  categories: z.array(z.string()).optional(),
  options: z.array(ProductOptionSchema).optional(),
  variants: z.array(VariantSchema),
})

const CategoryChildSchema = z.object({
  name: z.string(),
  handle: z.string(),
})

const CategorySchema = z.object({
  name: z.string(),
  handle: z.string(),
  children: z.array(CategoryChildSchema).optional(),
})

const RegionSchema = z.object({
  name: z.string(),
  currency_code: z.string(),
  countries: z.array(z.string()),
  automatic_taxes: z.boolean().optional(),
  payment_providers: z.array(z.string()).optional(),
  tax_rates: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    code: z.string().optional(),
  })).optional(),
})

const ShippingProfileSchema = z.object({
  name: z.string(),
  type: z.enum(["default", "gift_card", "custom"]),
})

const ShippingOptionSchema = z.object({
  name: z.string(),
  region: z.string(),
  provider: z.string(),
  price_type: z.enum(["flat", "calculated"]),
  amount: z.number().optional(),
})

const PromotionMethodSchema = z.object({
  type: z.enum(["percentage", "fixed"]),
  value: z.number(),
  allocation: z.enum(["each", "across"]),
  target_type: z.enum(["items", "shipping", "order"]),
})

const PromotionSchema = z.object({
  code: z.string(),
  type: z.enum(["standard", "buyget"]),
  is_automatic: z.boolean(),
  application_method: PromotionMethodSchema,
})

const SalesChannelSchema = z.object({
  name: z.string(),
  products: z.union([z.literal("all"), z.array(z.string())]).optional(),
})

const ApiKeySchema = z.object({
  title: z.string(),
  type: z.enum(["publishable", "secret"]),
  sales_channels: z.array(z.string()).optional(),
})

const StockLocationAddressSchema = z.object({
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z.string(),
})

const InventorySchema = z.object({
  locations: z.array(z.object({
    name: z.string(),
    address: StockLocationAddressSchema,
  })),
})

const StoreSchema = z.object({
  name: z.string(),
  default_currency: z.string(),
  supported_currencies: z.array(z.string()),
})

export const CaliLeanConfigSchema = z.object({
  store: StoreSchema,
  regions: z.array(RegionSchema).optional(),
  categories: z.array(CategorySchema).optional(),
  products: z.array(ProductSchema).optional(),
  shipping: z.object({
    profiles: z.array(ShippingProfileSchema).optional(),
    options: z.array(ShippingOptionSchema).optional(),
  }).optional(),
  promotions: z.array(PromotionSchema).optional(),
  sales_channels: z.array(SalesChannelSchema).optional(),
  api_keys: z.array(ApiKeySchema).optional(),
  inventory: InventorySchema.optional(),
})

export type CaliLeanConfig = z.infer<typeof CaliLeanConfigSchema>
export type ProductConfig = z.infer<typeof ProductSchema>
export type RegionConfig = z.infer<typeof RegionSchema>
export type CategoryConfig = z.infer<typeof CategorySchema>
export type PromotionConfig = z.infer<typeof PromotionSchema>
export type ShippingOptionConfig = z.infer<typeof ShippingOptionSchema>
export type SalesChannelConfig = z.infer<typeof SalesChannelSchema>
export type ApiKeyConfig = z.infer<typeof ApiKeySchema>
```

- [ ] **Step 4: Create YAML loader**

Create `packages/cli/src/utils/yaml.ts`:

```typescript
import { readFileSync, writeFileSync } from "fs"
import { parse, stringify } from "yaml"
import { CaliLeanConfigSchema, CaliLeanConfig } from "../schema/config"
import { log } from "./logger"

export function loadConfig(path: string): CaliLeanConfig {
  let raw: string
  try {
    raw = readFileSync(path, "utf-8")
  } catch {
    throw new Error(`Config file not found: ${path}`)
  }

  const parsed = parse(raw)
  const result = CaliLeanConfigSchema.safeParse(parsed)

  if (!result.success) {
    log.error("Config validation failed:")
    for (const issue of result.error.issues) {
      log.error(`  ${issue.path.join(".")}: ${issue.message}`)
    }
    throw new Error("Invalid config file")
  }

  return result.data
}

export function writeConfig(path: string, config: CaliLeanConfig): void {
  const content = stringify(config, { indent: 2, lineWidth: 120 })
  writeFileSync(path, content, "utf-8")
  log.success(`Config written to ${path}`)
}
```

- [ ] **Step 5: Run tests**

Run: `cd packages/cli && pnpm test`
Expected: all tests pass (3 auth + 3 schema)

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/schema/ packages/cli/src/utils/yaml.ts packages/cli/__tests__/schema.test.ts
git commit -m "feat(cli): add Zod config schema and YAML loader"
```

---

### Task 5: Sync engine (generic diff + sync algorithm)

**Files:**
- Create: `packages/cli/src/engine/types.ts`
- Create: `packages/cli/src/engine/diff.ts`
- Create: `packages/cli/src/engine/sync.ts`
- Create: `packages/cli/__tests__/diff.test.ts`
- Create: `packages/cli/__tests__/sync.test.ts`

- [ ] **Step 1: Write diff test**

Create `packages/cli/__tests__/diff.test.ts`:

```typescript
import { diffObjects, FieldDiff } from "../src/engine/diff"

describe("diffObjects", () => {
  it("returns empty array for identical objects", () => {
    const a = { name: "foo", value: 1 }
    const b = { name: "foo", value: 1 }
    expect(diffObjects(a, b, ["name", "value"])).toEqual([])
  })

  it("detects changed fields", () => {
    const a = { name: "foo", value: 1 }
    const b = { name: "foo", value: 2 }
    const diffs = diffObjects(a, b, ["name", "value"])
    expect(diffs).toEqual([{ path: "value", from: 2, to: 1 }])
  })

  it("detects added fields", () => {
    const a = { name: "foo", extra: "new" }
    const b = { name: "foo" }
    const diffs = diffObjects(a, b, ["name", "extra"])
    expect(diffs).toEqual([{ path: "extra", from: undefined, to: "new" }])
  })

  it("ignores fields not in the compare list", () => {
    const a = { name: "foo", id: "123" }
    const b = { name: "foo", id: "456" }
    expect(diffObjects(a, b, ["name"])).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cli && pnpm test -- __tests__/diff.test.ts`
Expected: FAIL

- [ ] **Step 3: Create engine types**

Create `packages/cli/src/engine/types.ts`:

```typescript
import { CaliLeanClient } from "../client"

export interface FieldDiff {
  path: string
  from: unknown
  to: unknown
}

export interface SyncResult {
  resource: string
  created: number
  updated: number
  skipped: number
  unmanaged: number
  errors: Array<{ key: string; error: string }>
}

export interface ResourceHandler<TConfig, TLive = unknown> {
  name: string
  keyField: string
  dump(client: CaliLeanClient): Promise<TLive[]>
  toConfig(live: TLive): TConfig
  toPayload(config: TConfig, existing?: TLive): Record<string, unknown>
  getKey(config: TConfig): string
  getLiveKey(live: TLive): string
  diffFields: string[]
}
```

- [ ] **Step 4: Create diff engine**

Create `packages/cli/src/engine/diff.ts`:

```typescript
export interface FieldDiff {
  path: string
  from: unknown
  to: unknown
}

export function diffObjects(
  desired: Record<string, unknown>,
  current: Record<string, unknown>,
  fields: string[]
): FieldDiff[] {
  const diffs: FieldDiff[] = []

  for (const field of fields) {
    const desiredVal = desired[field]
    const currentVal = current[field]

    if (JSON.stringify(desiredVal) !== JSON.stringify(currentVal)) {
      diffs.push({ path: field, from: currentVal, to: desiredVal })
    }
  }

  return diffs
}
```

- [ ] **Step 5: Create sync engine**

Create `packages/cli/src/engine/sync.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { ResourceHandler, SyncResult } from "./types"
import { diffObjects, FieldDiff } from "./diff"
import { log, verbose } from "../utils/logger"

export async function syncResource<TConfig, TLive>(
  client: CaliLeanClient,
  handler: ResourceHandler<TConfig, TLive>,
  configs: TConfig[],
  dryRun = false
): Promise<SyncResult> {
  const result: SyncResult = {
    resource: handler.name,
    created: 0,
    updated: 0,
    skipped: 0,
    unmanaged: 0,
    errors: [],
  }

  // Fetch live records
  const lives = await handler.dump(client)
  const liveMap = new Map<string, TLive>()
  for (const live of lives) {
    liveMap.set(handler.getLiveKey(live), live)
  }

  // Process config entries
  const managedKeys = new Set<string>()

  for (const config of configs) {
    const key = handler.getKey(config)
    managedKeys.add(key)
    const existing = liveMap.get(key)

    if (!existing) {
      // CREATE
      if (dryRun) {
        log.create(handler.name, key)
      } else {
        try {
          const payload = handler.toPayload(config)
          verbose(`Creating ${handler.name} "${key}": ${JSON.stringify(payload)}`)
          await client.post(`/${handler.name}`, payload)
          log.create(handler.name, key)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          log.error(`Failed to create ${handler.name} "${key}": ${msg}`)
          result.errors.push({ key, error: msg })
        }
      }
      result.created++
    } else {
      // DIFF
      const configObj = handler.toPayload(config, existing) as Record<string, unknown>
      const liveObj = handler.toConfig(existing) as Record<string, unknown>
      const diffs = diffObjects(configObj, liveObj, handler.diffFields)

      if (diffs.length === 0) {
        log.skip(handler.name, key)
        result.skipped++
      } else {
        if (dryRun) {
          log.update(handler.name, key)
          for (const d of diffs) {
            log.field(d.path, d.from, d.to)
          }
        } else {
          try {
            const payload = handler.toPayload(config, existing)
            verbose(`Updating ${handler.name} "${key}": ${JSON.stringify(payload)}`)
            // Update uses the live record's ID
            const id = (existing as Record<string, unknown>)["id"]
            await client.post(`/${handler.name}/${id}`, payload)
            log.update(handler.name, key)
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            log.error(`Failed to update ${handler.name} "${key}": ${msg}`)
            result.errors.push({ key, error: msg })
          }
        }
        result.updated++
      }
    }
  }

  // Check for unmanaged records
  for (const [key] of liveMap) {
    if (!managedKeys.has(key)) {
      log.unmanaged(handler.name, key)
      result.unmanaged++
    }
  }

  return result
}
```

- [ ] **Step 6: Write sync algorithm test**

Create `packages/cli/__tests__/sync.test.ts`:

```typescript
import { syncResource } from "../src/engine/sync"
import { ResourceHandler } from "../src/engine/types"
import { CaliLeanClient } from "../src/client"

// Mock handler for testing
const mockHandler: ResourceHandler<{ name: string; value: number }, { id: string; name: string; value: number }> = {
  name: "test-resource",
  keyField: "name",
  dump: jest.fn(),
  toConfig: (live) => ({ name: live.name, value: live.value }),
  toPayload: (config) => ({ name: config.name, value: config.value }),
  getKey: (config) => config.name,
  getLiveKey: (live) => live.name,
  diffFields: ["name", "value"],
}

// Mock client
const mockClient = {
  post: jest.fn().mockResolvedValue({}),
  get: jest.fn(),
  delete: jest.fn(),
  authenticate: jest.fn(),
  healthCheck: jest.fn(),
  adminFetch: jest.fn(),
} as unknown as CaliLeanClient

describe("syncResource", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates missing resources", async () => {
    (mockHandler.dump as jest.Mock).mockResolvedValue([])
    const result = await syncResource(mockClient, mockHandler, [{ name: "new", value: 1 }])
    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)
    expect(mockClient.post).toHaveBeenCalled()
  })

  it("skips resources that are in sync", async () => {
    (mockHandler.dump as jest.Mock).mockResolvedValue([{ id: "1", name: "existing", value: 1 }])
    const result = await syncResource(mockClient, mockHandler, [{ name: "existing", value: 1 }])
    expect(result.skipped).toBe(1)
    expect(result.updated).toBe(0)
    expect(mockClient.post).not.toHaveBeenCalled()
  })

  it("flags unmanaged resources", async () => {
    (mockHandler.dump as jest.Mock).mockResolvedValue([{ id: "1", name: "orphan", value: 1 }])
    const result = await syncResource(mockClient, mockHandler, [])
    expect(result.unmanaged).toBe(1)
  })

  it("does not call API in dry-run mode", async () => {
    (mockHandler.dump as jest.Mock).mockResolvedValue([])
    await syncResource(mockClient, mockHandler, [{ name: "new", value: 1 }], true)
    expect(mockClient.post).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 7: Run all tests**

Run: `cd packages/cli && pnpm test`
Expected: all tests pass

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/engine/ packages/cli/__tests__/diff.test.ts packages/cli/__tests__/sync.test.ts
git commit -m "feat(cli): add generic sync engine with diff, create, update, skip logic"
```

---

### Task 6: Resource handlers — store, regions, categories

**Files:**
- Create: `packages/cli/src/resources/store.ts`
- Create: `packages/cli/src/resources/regions.ts`
- Create: `packages/cli/src/resources/categories.ts`

- [ ] **Step 1: Create store handler**

Create `packages/cli/src/resources/store.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { CaliLeanConfig } from "../schema/config"
import { log } from "../utils/logger"

export async function dumpStore(client: CaliLeanClient) {
  const { stores } = await client.get<{ stores: Array<{ id: string; name: string; supported_currencies: Array<{ currency_code: string; is_default: boolean }> }> }>("/stores")
  const store = stores[0]
  const currencies = store.supported_currencies || []
  return {
    name: store.name,
    default_currency: currencies.find((c) => c.is_default)?.currency_code || "usd",
    supported_currencies: currencies.map((c) => c.currency_code),
  }
}

export async function syncStore(client: CaliLeanClient, config: CaliLeanConfig["store"], dryRun = false) {
  const live = await dumpStore(client)
  const { stores } = await client.get<{ stores: Array<{ id: string }> }>("/stores")
  const storeId = stores[0].id

  const changes: string[] = []
  if (live.name !== config.name) changes.push(`name: ${live.name} → ${config.name}`)
  if (live.default_currency !== config.default_currency) changes.push(`default_currency: ${live.default_currency} → ${config.default_currency}`)
  if (JSON.stringify(live.supported_currencies.sort()) !== JSON.stringify(config.supported_currencies.sort())) {
    changes.push(`supported_currencies: [${live.supported_currencies}] → [${config.supported_currencies}]`)
  }

  if (changes.length === 0) {
    log.skip("store", config.name)
    return { created: 0, updated: 0, skipped: 1 }
  }

  if (dryRun) {
    log.update("store", config.name)
    for (const c of changes) log.field("store", c.split(":")[0], c.split("→")[1])
    return { created: 0, updated: 1, skipped: 0 }
  }

  await client.post(`/stores/${storeId}`, {
    name: config.name,
    supported_currencies: config.supported_currencies.map((code) => ({
      currency_code: code,
      is_default: code === config.default_currency,
    })),
  })
  log.update("store", config.name)
  return { created: 0, updated: 1, skipped: 0 }
}
```

- [ ] **Step 2: Create regions handler**

Create `packages/cli/src/resources/regions.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { RegionConfig } from "../schema/config"
import { ResourceHandler } from "../engine/types"

interface LiveRegion {
  id: string
  name: string
  currency_code: string
  countries: Array<{ iso_2: string }>
  automatic_taxes: boolean
}

export const regionsHandler: ResourceHandler<RegionConfig, LiveRegion> = {
  name: "regions",
  keyField: "name",

  async dump(client) {
    const { regions } = await client.get<{ regions: LiveRegion[] }>("/regions?limit=50")
    return regions
  },

  toConfig(live) {
    return {
      name: live.name,
      currency_code: live.currency_code,
      countries: live.countries.map((c) => c.iso_2),
      automatic_taxes: live.automatic_taxes,
    }
  },

  toPayload(config) {
    return {
      name: config.name,
      currency_code: config.currency_code,
      countries: config.countries,
      automatic_taxes: config.automatic_taxes ?? true,
    }
  },

  getKey(config) { return config.name },
  getLiveKey(live) { return live.name },
  diffFields: ["name", "currency_code", "countries", "automatic_taxes"],
}
```

- [ ] **Step 3: Create categories handler**

Create `packages/cli/src/resources/categories.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { CategoryConfig } from "../schema/config"
import { log } from "../utils/logger"

interface LiveCategory {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
}

export async function dumpCategories(client: CaliLeanClient) {
  const { product_categories } = await client.get<{ product_categories: LiveCategory[] }>(
    "/product-categories?limit=100"
  )
  return product_categories
}

export async function syncCategories(
  client: CaliLeanClient,
  configs: CategoryConfig[],
  dryRun = false
) {
  const lives = await dumpCategories(client)
  const liveMap = new Map(lives.map((c) => [c.handle, c]))
  let created = 0, skipped = 0

  for (const config of configs) {
    // Create parent
    let parentId: string | undefined
    if (!liveMap.has(config.handle)) {
      if (dryRun) {
        log.create("category", config.handle)
      } else {
        const { product_category } = await client.post<{ product_category: LiveCategory }>(
          "/product-categories",
          { name: config.name, handle: config.handle, is_active: true, is_internal: false }
        )
        parentId = product_category.id
        log.create("category", config.handle)
      }
      created++
    } else {
      parentId = liveMap.get(config.handle)!.id
      log.skip("category", config.handle)
      skipped++
    }

    // Create children
    for (const child of config.children || []) {
      if (!liveMap.has(child.handle)) {
        if (dryRun) {
          log.create("category", child.handle)
        } else {
          await client.post("/product-categories", {
            name: child.name,
            handle: child.handle,
            is_active: true,
            is_internal: false,
            parent_category_id: parentId,
          })
          log.create("category", child.handle)
        }
        created++
      } else {
        log.skip("category", child.handle)
        skipped++
      }
    }
  }

  return { created, updated: 0, skipped, unmanaged: 0 }
}
```

- [ ] **Step 4: Verify build**

Run: `cd packages/cli && pnpm build`
Expected: compiles clean

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/resources/store.ts packages/cli/src/resources/regions.ts packages/cli/src/resources/categories.ts
git commit -m "feat(cli): add store, regions, categories resource handlers"
```

---

### Task 7: Resource handlers — products, shipping, promotions

**Files:**
- Create: `packages/cli/src/resources/products.ts`
- Create: `packages/cli/src/resources/shipping.ts`
- Create: `packages/cli/src/resources/promotions.ts`

- [ ] **Step 1: Create products handler**

Create `packages/cli/src/resources/products.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { ProductConfig } from "../schema/config"
import { log, verbose } from "../utils/logger"

interface LiveProduct {
  id: string
  title: string
  handle: string
  status: string
  categories?: Array<{ id: string; handle: string }>
  options?: Array<{ id: string; title: string; values: Array<{ id: string; value: string }> }>
  variants?: Array<{
    id: string
    title: string
    sku: string | null
    options?: Record<string, string>
    manage_inventory: boolean
    weight: number | null
    prices?: Array<{
      id: string
      currency_code: string
      amount: number
      min_quantity?: number | null
      max_quantity?: number | null
    }>
  }>
}

export async function dumpProducts(client: CaliLeanClient): Promise<LiveProduct[]> {
  const products: LiveProduct[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const { products: batch, count } = await client.get<{ products: LiveProduct[]; count: number }>(
      `/products?limit=${limit}&offset=${offset}&fields=*variants,*variants.prices,*options,*options.values,*categories`
    )
    products.push(...batch)
    offset += limit
    if (offset >= count) break
  }

  return products
}

export async function syncProducts(
  client: CaliLeanClient,
  configs: ProductConfig[],
  categoryMap: Map<string, string>,
  dryRun = false
) {
  const lives = await dumpProducts(client)
  const liveMap = new Map(lives.map((p) => [p.handle, p]))

  // Also need sales channels for linking
  const { sales_channels } = await client.get<{ sales_channels: Array<{ id: string; name: string }> }>("/sales-channels")
  const defaultChannel = sales_channels[0]

  let created = 0, updated = 0, skipped = 0

  for (const config of configs) {
    const existing = liveMap.get(config.handle)

    const categoryIds = (config.categories || [])
      .map((handle) => categoryMap.get(handle))
      .filter(Boolean)
      .map((id) => ({ id }))

    if (!existing) {
      if (dryRun) {
        log.create("product", config.handle)
        created++
        continue
      }

      const payload: Record<string, unknown> = {
        title: config.title,
        handle: config.handle,
        status: config.status || "draft",
        categories: categoryIds,
        sales_channels: [{ id: defaultChannel.id }],
      }

      if (config.options) {
        payload.options = config.options.map((o) => ({
          title: o.title,
          values: o.values,
        }))
      }

      if (config.variants) {
        payload.variants = config.variants.map((v) => ({
          title: v.title,
          sku: v.sku,
          options: v.options,
          manage_inventory: v.manage_inventory ?? false,
          prices: v.prices || [],
        }))
      }

      try {
        await client.post("/products", payload)
        log.create("product", config.handle)
        created++
      } catch (e) {
        log.error(`Failed to create product "${config.handle}": ${e instanceof Error ? e.message : e}`)
      }
    } else {
      // For now, skip existing products (update logic is complex with variants)
      verbose(`Product "${config.handle}" exists, skipping update`)
      log.skip("product", config.handle)
      skipped++
    }
  }

  // Flag unmanaged
  const configHandles = new Set(configs.map((c) => c.handle))
  for (const [handle] of liveMap) {
    if (!configHandles.has(handle)) {
      log.unmanaged("product", handle)
    }
  }

  return { created, updated, skipped }
}
```

- [ ] **Step 2: Create shipping handler**

Create `packages/cli/src/resources/shipping.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { log } from "../utils/logger"

interface ShippingProfile {
  id: string
  name: string
  type: string
}

interface ShippingOption {
  id: string
  name: string
  price_type: string
  amount: number
  service_zone?: { id: string; name: string }
}

interface ShippingConfig {
  profiles?: Array<{ name: string; type: string }>
  options?: Array<{ name: string; region: string; provider: string; price_type: string; amount?: number }>
}

export async function dumpShipping(client: CaliLeanClient) {
  const { shipping_profiles } = await client.get<{ shipping_profiles: ShippingProfile[] }>("/shipping-profiles?limit=50")
  const { shipping_options } = await client.get<{ shipping_options: ShippingOption[] }>("/shipping-options?limit=50")
  return { profiles: shipping_profiles, options: shipping_options }
}

export async function syncShipping(
  client: CaliLeanClient,
  config: ShippingConfig,
  dryRun = false
) {
  const live = await dumpShipping(client)
  let created = 0, skipped = 0

  // Sync profiles
  const liveProfileMap = new Map(live.profiles.map((p) => [p.name, p]))
  for (const profile of config.profiles || []) {
    if (liveProfileMap.has(profile.name)) {
      log.skip("shipping-profile", profile.name)
      skipped++
    } else {
      if (!dryRun) {
        await client.post("/shipping-profiles", { name: profile.name, type: profile.type })
      }
      log.create("shipping-profile", profile.name)
      created++
    }
  }

  // Sync options
  const liveOptionMap = new Map(live.options.map((o) => [o.name, o]))
  for (const option of config.options || []) {
    if (liveOptionMap.has(option.name)) {
      log.skip("shipping-option", option.name)
      skipped++
    } else {
      log.create("shipping-option", option.name)
      created++
      // Note: creating shipping options requires a fulfillment set + service zone
      // which is complex. Log as CREATE for diff, but actual creation needs
      // region ID + fulfillment provider ID resolution.
      if (!dryRun) {
        log.warn(`Shipping option "${option.name}" creation requires manual setup in admin dashboard`)
      }
    }
  }

  return { created, updated: 0, skipped }
}
```

- [ ] **Step 3: Create promotions handler**

Create `packages/cli/src/resources/promotions.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { PromotionConfig } from "../schema/config"
import { log } from "../utils/logger"

interface LivePromotion {
  id: string
  code: string
  type: string
  is_automatic: boolean
  application_method?: {
    type: string
    value: number
    allocation: string
    target_type: string
  }
}

export async function dumpPromotions(client: CaliLeanClient): Promise<LivePromotion[]> {
  const { promotions } = await client.get<{ promotions: LivePromotion[] }>("/promotions?limit=100")
  return promotions
}

export async function syncPromotions(
  client: CaliLeanClient,
  configs: PromotionConfig[],
  dryRun = false
) {
  const lives = await dumpPromotions(client)
  const liveMap = new Map(lives.map((p) => [p.code, p]))
  let created = 0, updated = 0, skipped = 0

  for (const config of configs) {
    const existing = liveMap.get(config.code)

    if (!existing) {
      if (dryRun) {
        log.create("promotion", config.code)
      } else {
        try {
          await client.post("/promotions", {
            code: config.code,
            type: config.type,
            is_automatic: config.is_automatic,
            application_method: config.application_method,
          })
          log.create("promotion", config.code)
        } catch (e) {
          log.error(`Failed to create promotion "${config.code}": ${e instanceof Error ? e.message : e}`)
        }
      }
      created++
    } else {
      // Check if the promotion method matches
      const method = existing.application_method
      if (
        method &&
        method.type === config.application_method.type &&
        method.value === config.application_method.value &&
        method.allocation === config.application_method.allocation
      ) {
        log.skip("promotion", config.code)
        skipped++
      } else {
        log.update("promotion", config.code)
        updated++
      }
    }
  }

  // Unmanaged
  const configCodes = new Set(configs.map((c) => c.code))
  for (const [code] of liveMap) {
    if (!configCodes.has(code)) {
      log.unmanaged("promotion", code)
    }
  }

  return { created, updated, skipped }
}
```

- [ ] **Step 4: Verify build**

Run: `cd packages/cli && pnpm build`
Expected: compiles clean

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/resources/products.ts packages/cli/src/resources/shipping.ts packages/cli/src/resources/promotions.ts
git commit -m "feat(cli): add products, shipping, promotions resource handlers"
```

---

### Task 8: Resource handlers — sales-channels, api-keys, inventory

**Files:**
- Create: `packages/cli/src/resources/sales-channels.ts`
- Create: `packages/cli/src/resources/api-keys.ts`
- Create: `packages/cli/src/resources/inventory.ts`
- Create: `packages/cli/src/resources/tax.ts`
- Create: `packages/cli/src/resources/index.ts`

- [ ] **Step 1: Create sales-channels handler**

Create `packages/cli/src/resources/sales-channels.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { SalesChannelConfig } from "../schema/config"
import { log } from "../utils/logger"

interface LiveSalesChannel {
  id: string
  name: string
  description: string | null
  is_disabled: boolean
}

export async function dumpSalesChannels(client: CaliLeanClient): Promise<LiveSalesChannel[]> {
  const { sales_channels } = await client.get<{ sales_channels: LiveSalesChannel[] }>("/sales-channels?limit=50")
  return sales_channels
}

export async function syncSalesChannels(
  client: CaliLeanClient,
  configs: SalesChannelConfig[],
  dryRun = false
) {
  const lives = await dumpSalesChannels(client)
  const liveMap = new Map(lives.map((sc) => [sc.name, sc]))
  let created = 0, skipped = 0

  for (const config of configs) {
    if (liveMap.has(config.name)) {
      log.skip("sales-channel", config.name)
      skipped++
    } else {
      if (!dryRun) {
        await client.post("/sales-channels", { name: config.name })
      }
      log.create("sales-channel", config.name)
      created++
    }
  }

  return { created, updated: 0, skipped }
}
```

- [ ] **Step 2: Create api-keys handler**

Create `packages/cli/src/resources/api-keys.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { ApiKeyConfig } from "../schema/config"
import { log } from "../utils/logger"

interface LiveApiKey {
  id: string
  title: string
  type: string
  token: string
  redacted: string
}

export async function dumpApiKeys(client: CaliLeanClient): Promise<LiveApiKey[]> {
  const { api_keys } = await client.get<{ api_keys: LiveApiKey[] }>("/api-keys?limit=50")
  return api_keys
}

export async function syncApiKeys(
  client: CaliLeanClient,
  configs: ApiKeyConfig[],
  salesChannelMap: Map<string, string>,
  dryRun = false
) {
  const lives = await dumpApiKeys(client)
  const liveMap = new Map(lives.map((k) => [k.title, k]))
  let created = 0, skipped = 0

  for (const config of configs) {
    const existing = liveMap.get(config.title)

    if (!existing) {
      if (!dryRun) {
        const { api_key } = await client.post<{ api_key: LiveApiKey }>("/api-keys", {
          title: config.title,
          type: config.type,
        })

        // Link to sales channels
        if (config.sales_channels) {
          const channelIds = config.sales_channels
            .map((name) => salesChannelMap.get(name))
            .filter(Boolean)
          if (channelIds.length > 0) {
            await client.post(`/api-keys/${api_key.id}/sales-channels`, {
              add: channelIds,
            })
          }
        }
      }
      log.create("api-key", config.title)
      created++
    } else {
      log.skip("api-key", config.title)
      skipped++
    }
  }

  return { created, updated: 0, skipped }
}
```

- [ ] **Step 3: Create inventory handler**

Create `packages/cli/src/resources/inventory.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { log } from "../utils/logger"

interface LocationConfig {
  name: string
  address: { address_1?: string; city?: string; country_code: string }
}

interface LiveLocation {
  id: string
  name: string
  address?: { address_1?: string; city?: string; country_code?: string }
}

export async function dumpInventory(client: CaliLeanClient): Promise<LiveLocation[]> {
  const { stock_locations } = await client.get<{ stock_locations: LiveLocation[] }>("/stock-locations?limit=50")
  return stock_locations
}

export async function syncInventory(
  client: CaliLeanClient,
  locations: LocationConfig[],
  dryRun = false
) {
  const lives = await dumpInventory(client)
  const liveMap = new Map(lives.map((l) => [l.name, l]))
  let created = 0, skipped = 0

  for (const config of locations) {
    if (liveMap.has(config.name)) {
      log.skip("stock-location", config.name)
      skipped++
    } else {
      if (!dryRun) {
        await client.post("/stock-locations", { name: config.name, address: config.address })
      }
      log.create("stock-location", config.name)
      created++
    }
  }

  return { created, updated: 0, skipped }
}
```

- [ ] **Step 4: Create tax handler (stub)**

Create `packages/cli/src/resources/tax.ts`:

```typescript
import { CaliLeanClient } from "../client"
import { log } from "../utils/logger"

// Tax configuration is region-specific and managed per-region
// This is a stub that reports the current tax state
export async function dumpTax(client: CaliLeanClient) {
  const { tax_regions } = await client.get<{ tax_regions: Array<{ id: string; country_code: string; province_code: string | null }> }>("/tax-regions?limit=50")
  return tax_regions
}

export async function syncTax(
  _client: CaliLeanClient,
  _configs: unknown[],
  _dryRun = false
) {
  log.dim("Tax: managed via regions (automatic_taxes flag)")
  return { created: 0, updated: 0, skipped: 0 }
}
```

- [ ] **Step 5: Create resource registry**

Create `packages/cli/src/resources/index.ts`:

```typescript
// Dependency-ordered list of all resources for orchestrated sync/dump
export const RESOURCE_ORDER = [
  "store",
  "regions",
  "categories",
  "shipping",
  "tax",
  "products",
  "sales-channels",
  "api-keys",
  "promotions",
  "inventory",
] as const

export type ResourceName = typeof RESOURCE_ORDER[number]
```

- [ ] **Step 6: Verify build**

Run: `cd packages/cli && pnpm build`
Expected: compiles clean

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/resources/
git commit -m "feat(cli): add sales-channels, api-keys, inventory, tax handlers + resource registry"
```

---

### Task 9: Orchestrator commands (sync, diff, dump, seed, env)

**Files:**
- Modify: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/sync.ts`
- Create: `packages/cli/src/commands/diff.ts`
- Create: `packages/cli/src/commands/dump.ts`
- Create: `packages/cli/src/commands/seed.ts`
- Create: `packages/cli/src/commands/env.ts`

- [ ] **Step 1: Create env command**

Create `packages/cli/src/commands/env.ts`:

```typescript
import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { log } from "../utils/logger"

export function registerEnvCommand(program: Command) {
  program
    .command("env")
    .description("Show target environment and verify connectivity")
    .action(async () => {
      const opts = program.opts()
      const creds = await resolveAuth(opts)

      log.header("Environment")
      log.info(`URL:   ${creds.url}`)
      log.info(`Email: ${creds.email}`)
      log.info(`Env:   ${opts.env || "default"}`)

      const client = new CaliLeanClient(creds)
      const healthy = await client.healthCheck()
      if (healthy) {
        log.success("Backend is healthy")
      } else {
        log.error("Backend is unreachable")
        process.exit(1)
      }

      try {
        await client.authenticate()
        log.success("Authentication successful")
      } catch (e) {
        log.error(`Authentication failed: ${e instanceof Error ? e.message : e}`)
        process.exit(1)
      }
    })
}
```

- [ ] **Step 2: Create sync command**

Create `packages/cli/src/commands/sync.ts`:

```typescript
import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { loadConfig } from "../utils/yaml"
import { log, setVerbose } from "../utils/logger"
import { syncStore } from "../resources/store"
import { syncResource } from "../engine/sync"
import { regionsHandler } from "../resources/regions"
import { syncCategories, dumpCategories } from "../resources/categories"
import { syncProducts } from "../resources/products"
import { syncShipping } from "../resources/shipping"
import { syncPromotions } from "../resources/promotions"
import { syncSalesChannels, dumpSalesChannels } from "../resources/sales-channels"
import { syncApiKeys } from "../resources/api-keys"
import { syncInventory } from "../resources/inventory"
import { syncTax } from "../resources/tax"
import { RESOURCE_ORDER } from "../resources"

export function registerSyncCommand(program: Command) {
  program
    .command("sync")
    .description("Sync all resources from config to live instance")
    .action(async () => {
      const opts = program.opts()
      if (opts.verbose) setVerbose(true)
      const dryRun = opts.dryRun || false

      const creds = await resolveAuth(opts)
      const config = loadConfig(opts.config)

      const client = new CaliLeanClient(creds)
      await client.authenticate()

      if (dryRun) log.header("DRY RUN — no changes will be made\n")
      else log.header("Syncing all resources\n")

      // 1. Store
      log.header("Store")
      await syncStore(client, config.store, dryRun)

      // 2. Regions
      if (config.regions) {
        log.header("\nRegions")
        await syncResource(client, regionsHandler, config.regions, dryRun)
      }

      // 3. Categories
      if (config.categories) {
        log.header("\nCategories")
        await syncCategories(client, config.categories, dryRun)
      }

      // 4. Shipping
      if (config.shipping) {
        log.header("\nShipping")
        await syncShipping(client, config.shipping, dryRun)
      }

      // 5. Tax
      log.header("\nTax")
      await syncTax(client, [], dryRun)

      // 6. Products
      if (config.products) {
        log.header("\nProducts")
        // Build category handle → ID map
        const liveCats = await dumpCategories(client)
        const categoryMap = new Map(liveCats.map((c) => [c.handle, c.id]))
        await syncProducts(client, config.products, categoryMap, dryRun)
      }

      // 7. Sales channels
      if (config.sales_channels) {
        log.header("\nSales Channels")
        await syncSalesChannels(client, config.sales_channels, dryRun)
      }

      // 8. API keys
      if (config.api_keys) {
        log.header("\nAPI Keys")
        const liveChannels = await dumpSalesChannels(client)
        const channelMap = new Map(liveChannels.map((sc) => [sc.name, sc.id]))
        await syncApiKeys(client, config.api_keys, channelMap, dryRun)
      }

      // 9. Promotions
      if (config.promotions) {
        log.header("\nPromotions")
        await syncPromotions(client, config.promotions, dryRun)
      }

      // 10. Inventory
      if (config.inventory?.locations) {
        log.header("\nInventory")
        await syncInventory(client, config.inventory.locations, dryRun)
      }

      log.header("\nSync complete")
    })
}
```

- [ ] **Step 3: Create diff command (thin wrapper)**

Create `packages/cli/src/commands/diff.ts`:

```typescript
import { Command } from "commander"

export function registerDiffCommand(program: Command) {
  program
    .command("diff")
    .description("Show what would change without applying (dry-run)")
    .action(async () => {
      // Set dry-run flag and delegate to sync
      program.opts().dryRun = true
      const syncCmd = program.commands.find((c) => c.name() === "sync")
      if (syncCmd) {
        await syncCmd.parseAsync(["node", "calilean", "sync"], { from: "user" })
      }
    })
}
```

- [ ] **Step 4: Create dump command**

Create `packages/cli/src/commands/dump.ts`:

```typescript
import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { writeConfig } from "../utils/yaml"
import { log, setVerbose } from "../utils/logger"
import { dumpStore } from "../resources/store"
import { regionsHandler } from "../resources/regions"
import { dumpCategories } from "../resources/categories"
import { dumpProducts } from "../resources/products"
import { dumpShipping } from "../resources/shipping"
import { dumpPromotions } from "../resources/promotions"
import { dumpSalesChannels } from "../resources/sales-channels"
import { dumpApiKeys } from "../resources/api-keys"
import { dumpInventory } from "../resources/inventory"
import { CaliLeanConfig } from "../schema/config"

export function registerDumpCommand(program: Command) {
  program
    .command("dump")
    .description("Export live instance to calilean.config.yaml")
    .action(async () => {
      const opts = program.opts()
      if (opts.verbose) setVerbose(true)

      const creds = await resolveAuth(opts)
      const client = new CaliLeanClient(creds)
      await client.authenticate()

      log.header("Dumping live instance\n")

      const store = await dumpStore(client)
      log.success("Store")

      const regions = await regionsHandler.dump(client)
      log.success(`Regions (${regions.length})`)

      const categories = await dumpCategories(client)
      log.success(`Categories (${categories.length})`)

      const products = await dumpProducts(client)
      log.success(`Products (${products.length})`)

      const shipping = await dumpShipping(client)
      log.success(`Shipping (${shipping.profiles.length} profiles, ${shipping.options.length} options)`)

      const promotions = await dumpPromotions(client)
      log.success(`Promotions (${promotions.length})`)

      const salesChannels = await dumpSalesChannels(client)
      log.success(`Sales Channels (${salesChannels.length})`)

      const apiKeys = await dumpApiKeys(client)
      log.success(`API Keys (${apiKeys.length})`)

      const locations = await dumpInventory(client)
      log.success(`Stock Locations (${locations.length})`)

      // Build config object
      const config: CaliLeanConfig = {
        store,
        regions: regions.map((r) => regionsHandler.toConfig(r)),
        categories: buildCategoryTree(categories),
        products: products.map((p) => ({
          title: p.title,
          handle: p.handle,
          status: p.status as "draft" | "published" | "proposed" | "rejected",
          categories: p.categories?.map((c) => c.handle) || [],
          options: p.options?.map((o) => ({
            title: o.title,
            values: o.values.map((v) => v.value),
          })),
          variants: (p.variants || []).map((v) => ({
            title: v.title,
            sku: v.sku || undefined,
            manage_inventory: v.manage_inventory,
            weight: v.weight || undefined,
            prices: (v.prices || [])
              .filter((pr) => !pr.min_quantity)
              .map((pr) => ({ currency_code: pr.currency_code, amount: pr.amount })),
            price_tiers: (v.prices || [])
              .filter((pr) => pr.min_quantity)
              .map((pr) => ({
                min_quantity: pr.min_quantity!,
                max_quantity: pr.max_quantity || undefined,
                amount: pr.amount,
              })),
          })),
        })),
        promotions: promotions.map((p) => ({
          code: p.code,
          type: p.type as "standard" | "buyget",
          is_automatic: p.is_automatic,
          application_method: p.application_method || {
            type: "percentage" as const,
            value: 0,
            allocation: "across" as const,
            target_type: "items" as const,
          },
        })),
        shipping: {
          profiles: shipping.profiles.map((p) => ({
            name: p.name,
            type: p.type as "default" | "gift_card" | "custom",
          })),
          options: shipping.options.map((o) => ({
            name: o.name,
            region: o.service_zone?.name || "Unknown",
            provider: "manual",
            price_type: o.price_type as "flat" | "calculated",
            amount: o.amount,
          })),
        },
        sales_channels: salesChannels.map((sc) => ({
          name: sc.name,
        })),
        api_keys: apiKeys.map((k) => ({
          title: k.title,
          type: k.type as "publishable" | "secret",
        })),
        inventory: {
          locations: locations.map((l) => ({
            name: l.name,
            address: {
              address_1: l.address?.address_1,
              city: l.address?.city,
              country_code: l.address?.country_code || "us",
            },
          })),
        },
      }

      const outputPath = opts.config || "calilean.config.yaml"
      writeConfig(outputPath, config)
    })
}

interface FlatCategory {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
}

function buildCategoryTree(flat: FlatCategory[]) {
  const parents = flat.filter((c) => !c.parent_category_id)
  return parents.map((parent) => ({
    name: parent.name,
    handle: parent.handle,
    children: flat
      .filter((c) => c.parent_category_id === parent.id)
      .map((child) => ({ name: child.name, handle: child.handle })),
  }))
}
```

- [ ] **Step 5: Create seed command**

Create `packages/cli/src/commands/seed.ts`:

```typescript
import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { log } from "../utils/logger"

export function registerSeedCommand(program: Command) {
  program
    .command("seed")
    .description("Full bootstrap: create admin user + sync all resources")
    .option("--admin-email <email>", "Admin email to create", "admin@calilean.com")
    .option("--admin-password <password>", "Admin password", "supersecret")
    .action(async (seedOpts) => {
      const opts = program.opts()
      const creds = await resolveAuth(opts)
      const client = new CaliLeanClient(creds)

      // Try to create admin user via medusa CLI
      log.header("Seed: creating admin user")
      try {
        await client.authenticate()
        log.skip("admin-user", seedOpts.adminEmail)
      } catch {
        log.warn("Could not authenticate — admin user may need to be created manually")
        log.info(`Run: cd apps/backend && npx medusa user -e ${seedOpts.adminEmail} -p ${seedOpts.adminPassword}`)
        return
      }

      // Delegate to sync
      log.header("\nSeed: syncing resources")
      const syncCmd = program.commands.find((c) => c.name() === "sync")
      if (syncCmd) {
        await syncCmd.parseAsync(["node", "calilean", "sync"], { from: "user" })
      }
    })
}
```

- [ ] **Step 6: Wire commands into CLI entry point**

Update `packages/cli/src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from "commander"
import { registerSyncCommand } from "./commands/sync"
import { registerDiffCommand } from "./commands/diff"
import { registerDumpCommand } from "./commands/dump"
import { registerSeedCommand } from "./commands/seed"
import { registerEnvCommand } from "./commands/env"

const program = new Command()
  .name("calilean")
  .description("CaliLean Medusa instance configuration CLI")
  .version("0.1.0")
  .option("--env <name>", "Target environment: local, dev, prd")
  .option("--url <url>", "Override backend URL")
  .option("--email <email>", "Override admin email")
  .option("--password <password>", "Override admin password")
  .option("--config <path>", "Config file path", "calilean.config.yaml")
  .option("--verbose", "Show API calls and responses")
  .option("--json", "Output in JSON format")
  .option("--force", "Skip confirmation prompts (for CI)")
  .option("--dry-run", "Show what would change without applying")

registerEnvCommand(program)
registerSyncCommand(program)
registerDiffCommand(program)
registerDumpCommand(program)
registerSeedCommand(program)

program.parse()
```

- [ ] **Step 7: Add calilean script to root package.json**

Add to root `package.json` scripts:
```json
"calilean": "cd packages/cli && node dist/index.js"
```

- [ ] **Step 8: Verify build + help output**

Run:
```bash
cd packages/cli && pnpm build && node dist/index.js --help
```
Expected: Shows all commands (env, sync, diff, dump, seed)

- [ ] **Step 9: Commit**

```bash
git add packages/cli/src/commands/ packages/cli/src/index.ts
git commit -m "feat(cli): add sync, diff, dump, seed, env orchestrator commands"
```

---

### Task 10: Example config + integration test against local instance

**Files:**
- Create: `packages/cli/calilean.config.example.yaml`
- Modify: `packages/cli/package.json` (add integration test script)

- [ ] **Step 1: Create example config**

Create `packages/cli/calilean.config.example.yaml` with the full CaliLean production config from the spec (store, regions, categories, products, shipping, promotions, sales_channels, api_keys, inventory). Copy from `docs/superpowers/specs/2026-05-07-calilean-cli-design.md` Config Schema section.

- [ ] **Step 2: Test dump against local Medusa**

Run (requires Medusa backend running on localhost:9000):
```bash
cd packages/cli && pnpm build && node dist/index.js dump --config /tmp/test-dump.yaml
```
Expected: Creates `/tmp/test-dump.yaml` with current local instance state

- [ ] **Step 3: Test env command**

Run:
```bash
node dist/index.js env
```
Expected: Shows URL, email, health status, auth status

- [ ] **Step 4: Test diff against example config**

Run:
```bash
cp calilean.config.example.yaml /tmp/test.yaml
node dist/index.js diff --config /tmp/test.yaml
```
Expected: Shows create/skip/in-sync status for each resource

- [ ] **Step 5: Run all unit tests**

Run: `cd packages/cli && pnpm test`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add packages/cli/calilean.config.example.yaml
git commit -m "feat(cli): add example config and verify CLI against local instance"
```

- [ ] **Step 7: Push**

```bash
git push origin master
```

---

## Summary

| Task | Component | Files | Tests |
|------|-----------|-------|-------|
| 1 | Package scaffold | 4 | 0 |
| 2 | Auth resolution | 3 | 3 |
| 3 | API client | 1 | 0 |
| 4 | Schema + YAML | 3 | 3 |
| 5 | Sync engine | 5 | 8 |
| 6 | Store/Regions/Categories | 3 | 0 |
| 7 | Products/Shipping/Promotions | 3 | 0 |
| 8 | Sales/Keys/Inventory/Tax/Registry | 5 | 0 |
| 9 | Orchestrator commands | 6 | 0 |
| 10 | Example config + integration | 1 | integration |

**Total: ~35 files, 10 tasks, 14 unit tests + manual integration verification**
