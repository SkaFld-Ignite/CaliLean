# CaliLean CLI — Design Spec

**Date:** 2026-05-07
**Status:** Approved
**Author:** Charles Sims + Claude

## Overview

A TypeScript CLI tool (`@calilean/cli`) that manages the full CaliLean Medusa instance configuration as code. Supports imperative per-resource commands and a declarative `calilean sync` that reconciles a YAML config file against a live Medusa instance. Targets local dev, staging, production, and CI environments.

## Goals

1. **Reproducibility** — any CaliLean environment can be fully provisioned from `calilean.config.yaml` + env vars
2. **Visibility** — `calilean diff` shows exactly what would change before applying
3. **Safety** — never auto-deletes, matches by natural keys (no hardcoded IDs), collects errors without aborting
4. **CI-ready** — runs non-interactively with `--force`, authenticates via env vars

## Package Location

```
packages/cli/
├── package.json              # @calilean/cli, bin: "calilean"
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry (commander.js)
│   ├── client.ts             # Medusa Admin API client
│   ├── auth/
│   │   ├── doppler.ts        # Doppler config resolution
│   │   └── env.ts            # Env var fallback
│   ├── commands/
│   │   ├── sync.ts           # calilean sync (orchestrator)
│   │   ├── diff.ts           # calilean diff (dry-run)
│   │   ├── dump.ts           # calilean dump (export live → YAML)
│   │   ├── seed.ts           # calilean seed (full bootstrap)
│   │   ├── env.ts            # calilean env (connectivity check)
│   │   └── resources/        # Per-resource commands
│   │       ├── products.ts
│   │       ├── categories.ts
│   │       ├── regions.ts
│   │       ├── shipping.ts
│   │       ├── payments.ts
│   │       ├── promotions.ts
│   │       ├── sales-channels.ts
│   │       ├── store.ts
│   │       ├── tax.ts
│   │       ├── inventory.ts
│   │       └── api-keys.ts
│   ├── schema/
│   │   ├── config.ts         # Zod schema for calilean.config.yaml
│   │   └── types.ts          # Inferred TypeScript types
│   └── utils/
│       ├── yaml.ts           # YAML read/write
│       ├── diff.ts           # Object diff engine
│       └── logger.ts         # Structured output (table, JSON, verbose)
└── calilean.config.yaml      # Example/template config
```

## Config Schema (calilean.config.yaml)

```yaml
store:
  name: "CaliLean"
  default_currency: "usd"
  supported_currencies: ["usd", "eur"]

regions:
  - name: "United States"
    currency_code: "usd"
    countries: ["us"]
    automatic_taxes: true
    payment_providers: ["pp_stripe_stripe", "pp_nmi-card", "pp_nmi"]
    tax_rates: []
  - name: "Europe"
    currency_code: "eur"
    countries: ["dk", "fr", "de", "it", "es", "se", "gb"]
    automatic_taxes: true
    payment_providers: ["pp_stripe_stripe"]
    tax_rates: []

categories:
  - name: "Peptides"
    handle: "peptides"
    children:
      - name: "Recovery"
        handle: "recovery"
      - name: "Weight Management"
        handle: "weight-management"
      - name: "Growth & Anti-Aging"
        handle: "growth-anti-aging"
      - name: "Longevity"
        handle: "longevity"
      - name: "Cosmetic"
        handle: "cosmetic"
  - name: "Supplies"
    handle: "supplies"

products:
  - title: "BPC-157"
    handle: "bpc-157"
    status: "published"
    categories: ["recovery"]
    options:
      - title: "Size"
        values: ["5mg", "10mg"]
    variants:
      - title: "5mg"
        sku: "CL-BPC-0005"
        options: { Size: "5mg" }
        manage_inventory: false
        weight: 0.05
        prices:
          - currency_code: "usd"
            amount: 29.74
        price_tiers:
          - min_quantity: 4
            max_quantity: 5
            amount: 26.77
          - min_quantity: 6
            max_quantity: 9
            amount: 25.28
          - min_quantity: 10
            amount: 23.79

sales_channels:
  - name: "Default Sales Channel"
    products: all

api_keys:
  - title: "Webshop"
    type: "publishable"
    sales_channels: ["Default Sales Channel"]

shipping:
  profiles:
    - name: "Default Shipping Profile"
      type: "default"
  options:
    - name: "Standard Shipping"
      region: "United States"
      provider: "manual"
      price_type: "flat"
      amount: 0
    - name: "Standard Return"
      region: "United States"
      provider: "manual"
      price_type: "flat"
      amount: 0

promotions:
  - code: "FIRST_PURCHASE"
    type: "standard"
    is_automatic: false
    application_method:
      type: "percentage"
      value: 10
      allocation: "across"
      target_type: "items"
  - code: "SUBSCRIBE_SAVE_15"
    type: "standard"
    is_automatic: false
    application_method:
      type: "percentage"
      value: 15
      allocation: "across"
      target_type: "items"

inventory:
  locations:
    - name: "CaliLean Warehouse"
      address:
        address_1: ""
        city: ""
        country_code: "us"
```

Each resource is identified by a natural key (handle, code, name) — no hardcoded Medusa IDs.

## CLI Commands

### Per-resource commands

```bash
calilean <resource> sync       # Create/update from config
calilean <resource> diff       # Show what would change
calilean <resource> dump       # Export live state to stdout YAML
```

Resources: `products`, `categories`, `regions`, `shipping`, `payments`, `promotions`, `sales-channels`, `store`, `api-keys`, `inventory`, `tax`

### Orchestrator commands

```bash
calilean sync                  # Sync all resources in dependency order
calilean diff                  # Dry-run diff of all resources
calilean dump                  # Export entire live instance to calilean.config.yaml
calilean seed                  # Full bootstrap: sync + create admin user + link API keys
calilean env                   # Show target environment, verify connectivity
calilean env --list            # List available Doppler configs
```

### Global flags

```
--env <name>        # Target environment: local, dev, prd
--url <url>         # Override backend URL directly
--config <path>     # Config file path (default: calilean.config.yaml)
--dry-run           # Alias for diff behavior
--verbose           # Show API calls and responses
--json              # Output in JSON instead of tables
--force             # Skip confirmation prompts (for CI)
```

### Sync dependency order

```
1.  store
2.  regions
3.  categories
4.  shipping
5.  tax
6.  products
7.  sales-channels
8.  api-keys
9.  promotions
10. inventory
11. payments (enable providers per region)
```

## Auth Resolution

Priority order:

1. `--url` + `--email` + `--password` flags (explicit)
2. Doppler config lookup via `--env` flag (shells out to `doppler secrets get`)
3. Environment variables: `MEDUSA_BACKEND_URL`, `MEDUSA_ADMIN_EMAIL`, `MEDUSA_ADMIN_PASSWORD`
4. Default: `http://localhost:9000` + `admin@calilean.com` + `supersecret`

Doppler env mapping:

| `--env` | Doppler config |
|---------|---------------|
| `local` | `dev_backend` |
| `dev`   | `dev_backend` |
| `stg`   | `stg`         |
| `prd`   | `prd_backend` |

CI: set env vars directly, use `--force` to skip prompts. No Doppler CLI needed.

## API Client

Uses `@medusajs/js-sdk` for standard Medusa resources. Raw `fetch` for custom plugin endpoints (invoice config, subscription config, ERP status, QR campaigns).

The client authenticates once via `POST /auth/user/emailpass`, stores the JWT, and includes it in all subsequent requests.

## Sync Engine

Each resource module implements:

```typescript
interface ResourceHandler<TConfig, TLive> {
  keyField: string
  dump(client): Promise<TLive[]>
  toConfig(live: TLive): TConfig
  toPayload(config: TConfig): Record<string, unknown>
  diff(config: TConfig, live: TLive): FieldDiff[]
  sync(client, configs: TConfig[], lives: TLive[]): Promise<SyncResult>
}
```

### Sync algorithm

1. Fetch all live records via `dump()`
2. Build lookup map by `keyField`
3. For each config entry:
   - Match by key → no match: CREATE
   - Match found → diff fields → changes: UPDATE, no changes: SKIP
4. Live records not in config → LOG warning (never auto-delete)
5. Return `{ created, updated, skipped, unmanaged }`

### Idempotency keys

| Resource | Key |
|----------|-----|
| Products | `handle` |
| Categories | `handle` |
| Regions | `name` |
| Promotions | `code` |
| Shipping options | `name` + `region` |
| Sales channels | `name` |
| API keys | `title` |
| Stock locations | `name` |
| Shipping profiles | `name` |

### Error handling

- Individual resource failures collected, not fatal — reported at end
- Network/auth failures abort immediately
- Each create/update logged with response for debugging
- `--verbose` shows full request/response

### Diff output format

```
Products:
  ~ BPC-157 (bpc-157)
    variants[0].prices[0].amount: 29.74 → 31.99
  + NAD+ (nad-plus)                          [CREATE]
  - E2E Test Product (e2e-test-product)      [UNMANAGED]

Regions:
  ✓ United States                            [IN SYNC]
  ✓ Europe                                   [IN SYNC]
```

## Dependencies

- `commander` — CLI framework
- `yaml` — YAML parse/serialize
- `zod` — config validation
- `chalk` — colored output
- `@medusajs/js-sdk` — Medusa Admin API client
- `cli-table3` — table output

## CI Integration (GitHub Actions)

```yaml
- name: Sync Medusa config
  env:
    MEDUSA_BACKEND_URL: ${{ secrets.MEDUSA_BACKEND_URL }}
    MEDUSA_ADMIN_EMAIL: ${{ secrets.MEDUSA_ADMIN_EMAIL }}
    MEDUSA_ADMIN_PASSWORD: ${{ secrets.MEDUSA_ADMIN_PASSWORD }}
  run: pnpm calilean sync --force
```

## Out of Scope

- Auto-deletion of unmanaged resources (log only, never delete)
- Database migrations (handled by `medusa db:migrate`)
- Plugin-specific data seeding beyond config (e.g., QR campaign content, review data)
- Multi-tenant / multi-store support
