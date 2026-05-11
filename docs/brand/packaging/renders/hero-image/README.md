# Hero Image Renders

Product hero renders used as PDP-primary / storefront thumbnail for each published product.

## Source & generation

- Generated 2026-05-11 via Imagen (the cleanly-named `*___VARIANT@2x.png_TIMESTAMP.jpeg` set).
- Iteration artifacts (`Recreate_vial_with_new_logo_*.jpeg`) intentionally excluded.

## Layout

Mirrors `renders/labels/` convention: one subdirectory per product, file named `<Product>___<Variant>.jpeg`.

| Product | File | Medusa handle |
|---|---|---|
| BPC-157 | `BPC_157/BPC-157___10mg.jpeg` | `bpc-157` |
| Bac Water | `Bac_Water/Bac-Water___10mL.jpeg` | `bac-water` |
| CL-1S | `CL_1S/CL-1S___10mg.jpeg` | `cl-1s` |
| CL-2T | `CL_2T/CL-2T___10mg.jpeg` | `cl-2t` |
| CL-3R | `CL_3R/CL-3R___10mg.jpeg` | `cl-3r` |
| GHK-Cu | `GHK_Cu/GHK-Cu___50mg.jpeg` | `ghk-cu` |
| GLOW | `GLOW/GLOW___70mg.jpeg` | `glow` |
| Ipamorelin | `Ipamorelin/Ipamorelin___10mg.jpeg` | `ipamorelin` |
| KLOW | `KLOW/KLOW___80mg.jpeg` | `klow` |
| MOTS-c | `MOTS_c/MOTS-c___10mg.jpeg` | `mots-c` |
| Melanotan 2 | `Melanotan_2/Melanotan-2___10mg.jpeg` | `melanotan-2` |
| SS-31 | `SS_31/SS-31___10mg.jpeg` | `ss-31` |
| TB-500 | `TB_500/TB-500___10mg.jpeg` | `tb-500` |
| Tesamorelin | `Tesamorelin/Tesamorelin___10mg.jpeg` | `tesamorelin` |
| Wolverine | `Wolverine/Wolverine___10mg.jpeg` | `wolverine` |

The hero image is applied product-wide (Medusa shares thumbnail/images across variants).

## Drive

Synced to `Cali Lean/Brand/Packaging/Hero Images/` via `npm run drive:push:all`.
Sync state tracked in `.sync-state.json` (repo root) — that is the canonical manifest.

## Storefront delivery

Uploaded to MinIO (`bucket-production-4a36.up.railway.app/medusa-media/`) and set as
Medusa `product.thumbnail` + `product.images[0]` via `scripts/migrate-hero-images.mjs`.
