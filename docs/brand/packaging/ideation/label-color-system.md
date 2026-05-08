# Label Color System — Final Spec

**Date:** 2026-05-07
**Status:** FINAL — 15 unique vial identities
**Constraint:** Honors the brand's <25% saturation budget and Salt & Iron palette

---

## System: Two Accent Points Per Vial

Every vial has **two** color-carrying elements that combine to create a unique identity:

1. **Favicon mark + QR code** → **Category color** (tells you the product family)
2. **Cap** → **Product color** (tells you the specific compound)

The accent element is the CaliLean favicon — a stylized lowercase "c" with a wave/swoosh tail — printed in the category color next to the wordmark on the label, and as metallic silver foil on the box front. The QR code shares the same category color. No two products share the same combination. You can identify any vial without reading the label.

```
         ┌───┐
         │cap│ ← product-unique color
         └─┬─┘
      ┌────┴────┐
      │         │
      │CaliLean ©│ ← "©" = favicon mark, in category color
      │──────────│
      │         │
      │BPC-157  │
      │(10MG)   │
      │         │
      │[QR] RUO │ ← QR code in category color
      └─────────┘
```

---

## Category Colors (favicon mark + QR code)

6 muted accent colors, one per product family. The favicon mark (CaliLean "c" wave) appears next to the wordmark on the label in the category color, and as metallic silver foil on the box front face.

| Category | Token | Hex | Swatch | Products in Category |
|----------|-------|-----|--------|---------------------|
| **Repair** | `cl-repair` | `#B8622E` | Ember | BPC-157, TB-500, GHK-Cu, Wolverine |
| **Metabolic** | `cl-metabolic` | `#6D8AA7` | Pacific | CL-1S, CL-2T, CL-3R |
| **GH Axis** | `cl-ghaxis` | `#5B6E8A` | Slate | Ipamorelin, Tesamorelin |
| **Longevity** | `cl-longevity` | `#7C8A78` | Eucalyptus | MOTS-C, SS-31 |
| **Specialty** | `cl-specialty` | `#8A6E5B` | Driftwood | GLOW, KLOW, Melanotan 2 |
| **Accessory** | `cl-accessory` | `#8B9298` | Fog | Bac Water |

> **Note on CL-3R**: CL-3R shares the Pacific favicon mark with the Metabolic category and uses a Pacific cap — favicon matches cap, establishing its signature monochrome identity as the Metabolic flagship.

---

## Palette Summary

**17 total unique hex values** (down from 19 — Navy and Forest dropped in favor of reusing Charcoal and Dusk Slate).

**Theoretical minimum: 9** — the Repair group (5 products) is the binding constraint, requiring 5 distinct cap colors. 6 favicon × 5 cap = 30 possible unique combos, more than enough for 15 products. Two of those 5 caps already exist as favicon colors (Pacific = CL-3R, Eucalyptus = MOTS-C), so only 3 net-new cap colors would be needed.

| Role | Hex Values |
|------|-----------|
| Favicon / QR (6) | `#B8622E` `#6D8AA7` `#5B6E8A` `#7C8A78` `#8A6E5B` `#8B9298` |
| Cap only (11) | `#4E5C72` `#2A6B6B` `#6B7E6B` `#3D3D3D` `#8A7D5A` `#7A4A35` `#4682B4` `#9A9478` `#7A6B5E` `#5E4538` `#B0B8BF` |

Cap colors shared across products: `#4E5C72` Dusk Slate (BPC-157, SS-31) · `#3D3D3D` Charcoal (Wolverine, Tesamorelin)

---

## Product Cap Colors (unique per product)

15 cap colors, one per product. Each is distinct within its category AND across the full lineup. All crimps are silver aluminum.

### Repair Category — Ember favicon mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **BPC-157** | Dusk Slate | `#4E5C72` | Muted blue-violet gray — cool, distinct. The Repair flagship with its own identity. |
| **TB-500** | Antique Gold | `#8A7D5A` | Desaturated olive-gold — warm contrast against Ember favicon. |
| **GHK-Cu** | Burnt Sienna | `#7A4A35` | Deep warm earth — nods to the compound's copper character. |
| **Wolverine** | Charcoal | `#3D3D3D` | Dark/aggressive — fits the "Wolverine" brand |

### Metabolic Category — Pacific favicon mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **CL-1S** (Semaglutide) | Patina | `#6B7E6B` | Muted green-gray — cool contrast against Pacific favicon. |
| **CL-2T** (Tirzepatide) | Deep Teal | `#2A6B6B` | Greener pull, distinct from Patina and Pacific. |
| **CL-3R** (Retatrutide) | Pacific Blue | `#6D8AA7` | Cap matches favicon mark — signature monochrome identity, the Metabolic flagship. |

### GH Axis Category — Slate favicon mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **Ipamorelin** | Steel Blue | `#4682B4` | Bright blue, stands out from Slate |
| **Tesamorelin** | Charcoal | `#3D3D3D` | Dark neutral — high contrast against Steel Blue; reuses Wolverine's cap (Slate+Charcoal vs Ember+Charcoal are unique combos) |

### Longevity Category — Eucalyptus favicon mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **MOTS-C** | Sage | `#7C8A78` | Cap matches favicon mark — the "signature" Longevity compound |
| **SS-31** | Dusk Slate | `#4E5C72` | Blue-violet gray — clearly distinct from Sage green; reuses BPC-157's cap (Eucalyptus+Dusk vs Ember+Dusk are unique combos) |

### Specialty Category — Driftwood favicon mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **GLOW** | Pewter Gold | `#9A9478` | Muted pewter-gold. Cooled from Sand Gold `#C2A878` for box harmony. |
| **KLOW** | Clay | `#7A6B5E` | Earthy mid-tone, slightly adjusted from `#8E7360` |
| **Melanotan 2** | Bronze | `#5E4538` | Dark warm, slightly deepened from `#6B4E3D` |

### Accessory Category — Fog favicon mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **Bac Water** | Light Gray | `#B0B8BF` | Clean, clinical, utilitarian |

---

## Complete Reference Table — All 15 Products

| # | Product | Category | Favicon / QR | Cap Color | Cap Hex | Unique Combo |
|---|---------|----------|--------------|-----------|---------|-------------|
| 1 | BPC-157 | Repair | Ember `#B8622E` | Dusk Slate | `#4E5C72` | Ember + Dusk |
| 2 | TB-500 | Repair | Ember `#B8622E` | Antique Gold | `#8A7D5A` | Ember + Gold |
| 3 | GHK-Cu | Repair | Ember `#B8622E` | Burnt Sienna | `#7A4A35` | Ember + Sienna |
| 4 | Wolverine | Repair | Ember `#B8622E` | Charcoal | `#3D3D3D` | Ember + Charcoal |
| 5 | CL-1S | Metabolic | Pacific `#6D8AA7` | Patina | `#6B7E6B` | Pacific + Patina |
| 6 | CL-2T | Metabolic | Pacific `#6D8AA7` | Deep Teal | `#2A6B6B` | Pacific + Teal |
| 7 | CL-3R | Metabolic | Pacific `#6D8AA7` | Pacific Blue | `#6D8AA7` | Pacific + Pacific |
| 8 | Ipamorelin | GH Axis | Slate `#5B6E8A` | Steel Blue | `#4682B4` | Slate + Steel |
| 9 | Tesamorelin | GH Axis | Slate `#5B6E8A` | Charcoal | `#3D3D3D` | Slate + Charcoal |
| 10 | MOTS-C | Longevity | Eucalyptus `#7C8A78` | Sage | `#7C8A78` | Eucalyptus + Sage |
| 11 | SS-31 | Longevity | Eucalyptus `#7C8A78` | Dusk Slate | `#4E5C72` | Eucalyptus + Dusk |
| 12 | GLOW | Specialty | Driftwood `#8A6E5B` | Pewter Gold | `#9A9478` | Driftwood + Gold |
| 13 | KLOW | Specialty | Driftwood `#8A6E5B` | Clay | `#8E7360` | Driftwood + Clay |
| 14 | Melanotan 2 | Specialty | Driftwood `#8A6E5B` | Bronze | `#6B4E3D` | Driftwood + Bronze |
| 15 | Bac Water | Accessory | Fog `#8B9298` | Light Gray | `#B0B8BF` | Fog + Gray |

---

## Visual Quick-ID Guide

```
REPAIR (Ember favicon):
  BPC-157    © Ember       🔷 Dusk Slate cap  — cool blue-violet, flagship
  TB-500     © Ember       🟡 Antique Gold cap — desaturated olive-gold
  GHK-Cu     © Ember       🟠 Burnt Sienna cap — deep warm earth
  Wolverine  © Ember       ⚫ Charcoal cap    — dark/aggressive

METABOLIC (Pacific favicon):
  CL-1S      © Pacific     🟤 Patina cap      — muted green-gray
  CL-2T      © Pacific     🟢 Deep Teal cap   — greener pull
  CL-3R      © Pacific     🔵 Pacific Blue cap — favicon matches cap, signature monochrome flagship

GH AXIS (Slate favicon):
  Ipamorelin  © Slate      🔵 Steel Blue cap  — bright blue
  Tesamorelin © Slate      ⚫ Charcoal cap    — dark neutral, high contrast

LONGEVITY (Eucalyptus favicon):
  MOTS-C     © Eucalyptus  🟢 Sage cap        — favicon matches cap, signature monochrome
  SS-31      © Eucalyptus  🔷 Dusk Slate cap  — blue-violet, clearly distinct from Sage

SPECIALTY (Driftwood favicon):
  GLOW       © Driftwood   🟡 Pewter Gold cap — luminous
  KLOW       © Driftwood   🟤 Clay cap        — earthy
  MT-2       © Driftwood   🟤 Bronze cap      — dark

ACCESSORY (Fog favicon):
  Bac Water  © Fog         ⚪ Light Gray cap  — neutral
```

---

## Design Rules

1. **Favicon mark and QR code always match** — same category color on both elements; the favicon is the CaliLean "c" wave mark, not the `=` sign
2. **Cap and crimp never match** — cap is the product color, crimp is always silver aluminum
3. **One "signature" monochrome product per category** — MOTS-C (Longevity) and CL-3R (Metabolic) match cap to favicon color
4. **CL-3R owns Pacific Blue cap** — no other product uses `#6D8AA7` as a cap color; CL-3R is the Metabolic flagship with a monochrome Pacific identity
5. **Metabolic caps graduate cool** — CL-1S (Patina/muted green-gray) → CL-2T (Deep Teal/greener) → CL-3R (Pacific Blue/monochrome flagship)
6. **GHK-Cu cap is Burnt Sienna** — deep warm earth that references the compound's copper character without matching any other cap
7. **All cap colors remain muted/desaturated** — no neons, no primaries, no high-saturation

---

## Variant Handling

Size variants (5mg vs 10mg, 10mg vs 30mg) share the same color combo. Only the dosage text changes. One render per product covers all variants.

| Product | Variants | Same Render? |
|---------|----------|-------------|
| BPC-157 | 5mg, 10mg | Yes — swap text |
| CL-1S | 10mg, 30mg | Yes — swap text |
| Wolverine | 5mg, 10mg | Yes — 2-vial stack, swap text |
| Bac Water | 3mL, 10mL | Maybe different vial size |

---

## Renders Needed

| # | Product | Type | Cap Hex | Favicon / QR Hex | Status |
|---|---------|------|---------|-----------------|--------|
| 1 | BPC-157 | Single vial + box | `#4E5C72` | `#B8622E` | Re-render (Ember favicon replaces Pacific) |
| 2 | TB-500 | Single vial + box | `#8A7D5A` | `#B8622E` | Re-render (Ember favicon + Antique Gold cap replaces Teal) |
| 3 | GHK-Cu | Single vial + box | `#7A4A35` | `#B8622E` | Re-render (Ember favicon + Burnt Sienna cap replaces Patina) |
| 4 | Wolverine | 2-vial stack + box | `#3D3D3D` | `#B8622E` | Re-render (Ember favicon replaces Pacific) |
| 5 | CL-1S | Single vial + box | `#6B7E6B` | `#6D8AA7` | Re-render (Patina cap replaces Antique Gold) |
| 6 | CL-2T | Single vial + box | `#2A6B6B` | `#6D8AA7` | Re-render (Deep Teal cap replaces Burnt Sienna) |
| 7 | CL-3R | Single vial + box | `#6D8AA7` | `#6D8AA7` | ✅ Approved — no change (Pacific favicon + Pacific cap) |
| 8 | Ipamorelin | Single vial + box | `#4682B4` | `#5B6E8A` | **NEW** (standalone, not CJC stack) |
| 9 | Tesamorelin | Single vial + box | `#3D3D3D` | `#5B6E8A` | **NEW** (Charcoal cap) |
| 10 | MOTS-C | Single vial + box | `#7C8A78` | `#7C8A78` | Re-render (favicon replaces `=`) |
| 11 | SS-31 | Single vial + box | `#4E5C72` | `#7C8A78` | **NEW** (Dusk Slate cap) |
| 12 | GLOW | Single vial + box | `#9A9478` | `#8A6E5B` | **NEW** |
| 13 | KLOW | Single vial + box | `#7A6B5E` | `#8A6E5B` | **NEW** |
| 14 | Melanotan 2 | Single vial + box | `#5E4538` | `#8A6E5B` | **NEW** |
| 15 | Bac Water | Single vial + box | `#B0B8BF` | `#8B9298` | **NEW** |

**14 renders needed** (6 re-renders + 8 new — CL-3R unchanged)
CL-3R render is approved and serves as the template for all other Metabolic renders.
