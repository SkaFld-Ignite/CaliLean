# Agent Context — CaliLean

> **Read this file at the start of every Claude Code session on this project.**
> Last updated: 2026-05-06 by Charles Sims

## Project Identity

- **Name:** CaliLean
- **Repo:** https://github.com/SkaFld-Ignite/CaliLean.git
- **Type:** Client project
- **Client:** Cali Lean (peptide/RUO wellness brand)
- **Practice area:** SkaFld Ignite

## What You Need to Know Right Now

- CaliLean is a **Medusa v2.14.1** headless commerce platform with a **Next.js 15** storefront, deployed on **Railway**
- Production is live at **calilean.com** (storefront) and **admin.calilean.com** (backend)
- Secrets are managed in **Doppler** (project: `calilean`) with per-service branch configs (`dev_backend`, `dev_storefront`, `prd_backend`, `prd_storefront`)
- The backend uses `patch-workflows.js` to fix pnpm duplicate workflow registration — always include `NODE_OPTIONS='--require ./patch-workflows.js'` when running `medusa develop`
- **Production publishable API key mismatch** — the storefront env has a key that doesn't match the one in the Medusa API keys table. This is actively breaking the live store API.

## Architecture Quick Reference

```
CaliLean/
├── apps/
│   ├── backend/          # Medusa v2.14.1 — API (port 9000), Admin (/app)
│   └── storefront/       # Next.js 15 App Router — SSR storefront (port 8000)
├── packages/
│   ├── plugin-ai-studio/     # Google AI image generation (conditional on GOOGLE_API_KEY)
│   ├── plugin-bundles/       # Product bundling
│   ├── plugin-email/         # Resend transactional emails
│   ├── plugin-erp/           # ERPNext integration (Sales Invoice + Payment Entry)
│   ├── plugin-invoices/      # PDF invoice generation
│   ├── plugin-loyalty/       # Loyalty points system
│   ├── plugin-preorder/      # Preorder management
│   ├── plugin-qr-marketing/  # QR code marketing
│   ├── plugin-reviews/       # Product reviews
│   ├── plugin-shipstation/   # ShipStation fulfillment
│   └── plugin-subscription/  # Subscription orders
├── scripts/
│   └── seed-local.sh     # Seeds local DB to match production (15 products, categories, regions)
└── doppler.yaml          # Maps apps/backend → dev_backend, apps/storefront → dev_storefront
```

**Data flow:** Storefront (Next.js SSR) → Medusa Store API → Modules/Workflows → PostgreSQL
**Admin flow:** Admin Dashboard → Medusa Admin API → Modules/Workflows → PostgreSQL
**ERP sync:** Order events → plugin-erp subscriber → ERPNext API (Sales Invoice, Payment Entry)

**Railway services:** Backend, Storefront, Postgres, Redis, MinIO (Bucket), MeiliSearch, Console

## Patterns and Conventions in This Codebase

- **All mutations go through workflows** — never call module services directly from API routes
- **HTTP methods:** GET, POST, DELETE only — no PUT/PATCH (Medusa v2 convention)
- **Module isolation:** Cross-module reads use `query.graph()` or `query.index()`, never direct service imports
- **Plugins are conditionally loaded** via env var checks in `medusa-config.ts` (e.g., `...(GOOGLE_API_KEY ? [plugin] : [])`)
- **Prices are display values** — 49.99 means $49.99, NOT cents. Never divide by 100.
- **Storefront routing:** `[countryCode]` i18n prefix on all routes, async `cookies()` required (Next.js 15)
- **Storefront API calls:** Always use `@medusajs/js-sdk`, never raw `fetch()`
- **Product categories:** Peptides (parent) → Recovery, Weight Management, Growth & Anti-Aging, Longevity, Cosmetic (children) + Supplies (top-level)

## Things That Will Bite You

1. **pnpm virtual store duplicates** — `@medusajs/core-flows` resolves from multiple virtual store paths, causing `WorkflowManager.register` to throw "already exists". The `patch-workflows.js` monkey-patch handles this. Always use `pnpm dev` (not bare `medusa develop`).
2. **Publishable API key must be linked to a sales channel** — without this, the store API returns "Publishable key needs to have a sales channel configured".
3. **`.pnpmfile.cjs`** pins `@medusajs/*` peer deps to 2.14.1 — don't remove this or the workflow dupe issue returns.
4. **Railway `NIXPACKS_BUILD_CMD`** only builds `plugin-qr-marketing` — adding new plugins to production requires updating this env var.
5. **RUO compliance** — certain US states have checkout suppression rules in `apps/backend/src/lib/ruo*`. Don't remove these.
6. **Age gate** — storefront requires 21+ verification at `/gate` before accessing the store. This is a legal requirement.
7. **Module names must be camelCase** in `medusa-config.ts` — dashes cause runtime errors.
8. **No `await import()`** in route handlers — use static imports only.

## Current Session Handoff

- **Last session:** 2026-05-06, Charles Sims
- **What was done:**
  - Full local dev environment setup (PostgreSQL, migrations, plugin builds, admin user, seed data)
  - Doppler secret management configured (4 branch configs: dev_backend, dev_storefront, prd_backend, prd_storefront)
  - Production Railway env vars imported into Doppler
  - Cleaned up legacy `backend/` and `storefront/` dirs (~615MB freed)
  - Added plugin-ai-studio (conditional), patch-workflows.js, doppler.yaml
  - Merged `feat/local-dev-setup` into master and pushed
  - Added MedusaDocs + Stripe MCP servers to Claude Code settings
- **What's in progress:** Production publishable API key mismatch (storefront has wrong key)
- **Immediate next step:** Fix the publishable key mismatch so the live storefront can fetch products
- **Open questions:**
  - Should Doppler be wired to Railway (Doppler integration) to replace direct Railway env vars?
  - When to tag v0.2.0?

---
*Updated by: Charles Sims on 2026-05-06*
