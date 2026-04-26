# CaliLean — Imagery Hosting (MinIO Bucket Layout)

**Owner:** CTO
**Tracking:** [SKA-15](/SKA/issues/SKA-15)
**Built against:** [system-spec.md](./system-spec.md) §2 (Surface taxonomy), §10 (Directory)
**Pairs with:** [`scripts/upload-brand-image.mjs`](../../../scripts/upload-brand-image.mjs)

This document is the contract for where brand imagery lives in MinIO. Every render Designer produces, every product photo we migrate, every hero campaign asset — they all land at deterministic paths defined here. No ULID-randomized filenames in this tree (that pattern is reserved for the Medusa file provider's user-uploaded admin assets).

---

## 1. Bucket

| Use | Bucket | Notes |
| --- | --- | --- |
| Brand + product imagery | `calilean-media` | Public-read. Same MinIO instance as the Medusa file provider. |
| Medusa admin uploads | `medusa-media` (default) | Untouched by these helpers — that path remains ULID-randomized. |

The brand bucket is intentionally **separate** from the Medusa-managed bucket so Designer can drop production renders into deterministic paths without colliding with admin-uploaded assets. Both buckets live on the same MinIO endpoint and share credentials (`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`).

The upload helper auto-creates `calilean-media` with the same public-read policy the Medusa provider uses.

---

## 2. Path layout

```
calilean-media/
├── products/
│   └── <sku-slug>/
│       ├── pdp-primary.<ext>
│       ├── pdp-gallery-01.<ext>
│       ├── pdp-gallery-02.<ext>
│       ├── pdp-gallery-03.<ext>
│       ├── pdp-gallery-04.<ext>
│       ├── pdp-context.<ext>
│       └── thumb-1x1.<ext>           ← required 1:1 derivative (system-spec §2)
├── hero/
│   └── <campaign-slug>/
│       ├── hero-16x9.<ext>
│       ├── hero-4x5.<ext>
│       └── og-card.<ext>
├── editorial/
│   └── <slug>.<ext>
└── lifestyle/
    └── <slug>.<ext>
```

### Path rules
- `<sku-slug>` is lower-kebab, no prefix duplication. Example: `bpc157-5mg` (not `cl-bpc157-5mg`, not `BLUUM-BPC157-5MG`). The `cl-` prefix is reserved for the Medusa SKU field; it adds no value in the path.
- Surface enum (must match exactly): `pdp-primary`, `pdp-gallery-NN` (zero-padded two-digit), `pdp-context`, `hero-16x9`, `hero-4x5`, `og-card`, `thumb-1x1`. Any other surface name → kick the upload back.
- Extension: `avif` for the canonical asset, `jpg` for the fallback. Always upload both. Never upload `png` to a published path (PNG is fine in `staging/` while iterating).
- No spaces, no uppercase, no underscores. Hyphen-separated only.

### Staging area
While Designer is iterating, files land at `calilean-media/staging/<sku-slug>/<freeform>.<ext>`. Staging is **not** the contract — anything in `staging/` is allowed to be deleted without notice. The upload helper supports `--staging` to drop into this prefix.

---

## 3. Surface enum (canonical)

This is the source of truth that storefront, scripts, and CMS configs all reference. Mirrors [system-spec.md §2](./system-spec.md#2-surface-taxonomy) plus the implicit thumb derivative.

| Surface key | Aspect | Min long edge | Required for product | Required for hero |
| --- | --- | --- | --- | --- |
| `pdp-primary` | 1:1 | 2000px | yes | — |
| `pdp-gallery-NN` | 1:1 | 2000px | ≥1 | — |
| `pdp-context` | 4:5 | 2000px | yes | — |
| `thumb-1x1` | 1:1 | 800px | yes | — |
| `hero-16x9` | 16:9 | 2400px | — | yes |
| `hero-4x5` | 4:5 | 2000px | — | yes (social derivative) |
| `og-card` | 1.91:1 | 1200px | — | yes |
| `editorial` | 3:2 | 1800px | — | — |
| `lifestyle` | 4:5 or 1:1 | 1600px | — | — |

The script enforces the surface key but **does not yet enforce dimension/aspect** — that's a v1 follow-up gated on adding a vips/sharp dependency. Until then: Designer eyeballs the spec, CMO QAs the renders against it.

---

## 4. URLs and CDN

Public URL pattern (after upload):

```
https://<MINIO_ENDPOINT>/calilean-media/products/<sku-slug>/<surface>.<ext>
```

Storefront should reference these via a small URL helper (TBD in storefront PR — likely `storefront/src/lib/brand/imagery.ts`) that takes `(sku, surface)` and returns the canonical URL with the AVIF / JPG `<picture>` fallback wired up. That helper is not in scope for [SKA-15](/SKA/issues/SKA-15); it lands with the brand-swap PRs in [SKA-4](/SKA/issues/SKA-4).

Cache headers set on upload:
- `Content-Type` from extension (`image/avif`, `image/jpeg`, etc.)
- `Cache-Control: public, max-age=31536000, immutable` — paths are deterministic, so versioning happens via SKU/campaign slug rotation, never by busting the URL.
- `x-amz-acl: public-read`

---

## 5. Upload helper usage

```bash
# Local (you point MINIO_* env at staging or prod MinIO)
node scripts/upload-brand-image.mjs \
  --sku bpc157-5mg \
  --surface pdp-primary \
  --file ./renders/bpc157/pdp-primary.avif

# Hero campaign
node scripts/upload-brand-image.mjs \
  --campaign launch-q2 \
  --surface hero-16x9 \
  --file ./renders/launch-q2/hero.avif

# Editorial / lifestyle
node scripts/upload-brand-image.mjs \
  --section editorial \
  --slug coa-explainer \
  --file ./renders/editorial/coa-explainer.jpg

# Staging (free-form path, no surface enforcement)
node scripts/upload-brand-image.mjs \
  --sku bpc157-5mg \
  --staging \
  --file ./renders/wip/draft-03.png
```

Required env (read from process env or `backend/.env` if present):
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BRAND_BUCKET` (optional, defaults to `calilean-media`)

The script is idempotent and overwrites — that's intentional, the path is the version key.

---

## 6. Migrating existing product images

The 33 seed products currently reference Medusa-uploaded URLs (ULID-randomized in `medusa-media`). Migration plan:

1. Designer ships per-SKU renders into `staging/<sku-slug>/`.
2. CMO + Designer QA against [system-spec.md](./system-spec.md).
3. CTO promotes from staging to canonical paths via the upload helper (one PR per SKU batch).
4. Storefront PR (part of [SKA-4](/SKA/issues/SKA-4)) flips the image URL helper from Medusa file URLs to the deterministic `calilean-media` URLs.
5. `medusa-media` product images are left in place for one release cycle, then deleted.

This migration is **not in scope for [SKA-15](/SKA/issues/SKA-15)** — only the layout and helper. Migration ticket gets cut once Designer has approved renders to push.

---

## 7. Open questions

- **CDN front:** running MinIO public URLs straight to the browser is fine for MVP, but at >1k DAU we should front it with Cloudflare or Bunny. Defer until traffic warrants.
- **Dimension validation:** add `sharp` to the helper to validate aspect + min long edge before upload. Worth doing if the QA loop misses spec violations more than once.
- **SKU slug authority:** the script trusts the caller. Once the new CaliLean SKU table is finalized, add a lookup that rejects unknown SKUs.
