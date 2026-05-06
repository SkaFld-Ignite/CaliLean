# Label Color System — Final Spec

**Date:** 2026-04-30
**Status:** FINAL — 15 unique vial identities
**Constraint:** Honors the brand's <25% saturation budget and Salt & Iron palette

---

## System: Two Accent Points Per Vial

Every vial has **two** color-carrying elements that combine to create a unique identity:

1. **`=` mark + QR code** → **Category color** (tells you the product family)
2. **Cap** → **Product color** (tells you the specific compound)

No two products share the same combination. You can identify any vial without reading the label.

```
         ┌───┐
         │cap│ ← product-unique color
         └─┬─┘
      ┌────┴────┐
      │         │
      │CaliLean │
      │    ══   │ ← category color (= mark)
      │         │
      │RESEARCH │
      │GRADE    │
      │BPC-157  │
      │(10MG)   │
      │         │
      │[QR] RUO │ ← category color (QR code)
      └─────────┘
```

---

## Category Colors (= mark + QR code)

6 muted accent colors, one per product family:

| Category | Token | Hex | Swatch | Products in Category |
|----------|-------|-----|--------|---------------------|
| **Repair** | `cl-repair` | `#3A5A6A` | Pacific | BPC-157, TB-500, GHK-Cu, Wolverine |
| **Metabolic** | `cl-metabolic` | `#B8622E` | Ember | CL-1S, CL-2T, CL-3R |
| **GH Axis** | `cl-ghaxis` | `#5B6E8A` | Slate | Ipamorelin, Tesamorelin |
| **Longevity** | `cl-longevity` | `#7C8A78` | Eucalyptus | MOTS-c, SS-31 |
| **Specialty** | `cl-specialty` | `#8A6E5B` | Driftwood | GLOW, KLOW, Melanotan 2 |
| **Accessory** | `cl-accessory` | `#8B9298` | Fog | Bac Water |

---

## Product Cap Colors (unique per product)

15 cap colors, one per product. Each is distinct within its category AND across the full lineup. All crimps are silver aluminum.

### Repair Category — Pacific `=` mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **BPC-157** | Pacific Blue | `#3A5A6A` | Cap matches `=` mark — the "signature" Repair compound |
| **TB-500** | Deep Teal | `#2A6B6B` | Greener pull, distinct from Pacific |
| **GHK-Cu** | Patina | `#6B7E6B` | Muted green-gray, nods to copper patina. Cooled from original Copper `#8B5E3C` for box harmony. |
| **Wolverine** | Charcoal | `#3D3D3D` | Dark/aggressive — fits the "Wolverine" brand |

### Metabolic Category — Ember `=` mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **CL-1S** (Semaglutide) | Antique Gold | `#8A7D5A` | Desaturated olive-gold. Cooled from Amber `#C4842D` for box harmony. |
| **CL-2T** (Tirzepatide) | Burnt Sienna | `#7A4A35` | Deeper/darker, cooled from `#A0522D` |
| **CL-3R** (Retatrutide) | Pacific Blue | `#3A5A6A` | Breaks from Metabolic category — Pacific accent + Pacific cap. Signature product with its own identity. |

### GH Axis Category — Slate `=` mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **Ipamorelin** | Steel Blue | `#4682B4` | Brighter blue, stands out from Slate |
| **Tesamorelin** | Navy | `#2C3E50` | Darker, more serious tone |

### Longevity Category — Eucalyptus `=` mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **MOTS-c** | Sage | `#7C8A78` | Cap matches `=` mark — the "signature" Longevity compound |
| **SS-31** | Forest | `#4A6350` | Deeper green, distinct from Sage |

### Specialty Category — Driftwood `=` mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **GLOW** | Pewter Gold | `#9A9478` | Muted pewter-gold. Cooled from Sand Gold `#C2A878` for box harmony. |
| **KLOW** | Clay | `#7A6B5E` | Earthy mid-tone, slightly adjusted from `#8E7360` |
| **Melanotan 2** | Bronze | `#5E4538` | Dark warm, slightly deepened from `#6B4E3D` |

### Accessory Category — Fog `=` mark

| Product | Cap Color | Cap Hex | Visual Contrast |
|---------|-----------|---------|-----------------|
| **Bac Water** | Light Gray | `#B0B8BF` | Clean, clinical, utilitarian |

---

## Complete Reference Table — All 15 Products

| # | Product | Category | `=` Mark / QR | Cap Color | Cap Hex | Unique Combo |
|---|---------|----------|--------------|-----------|---------|-------------|
| 1 | BPC-157 | Repair | Pacific `#3A5A6A` | Pacific Blue | `#3A5A6A` | Pacific + Pacific |
| 2 | TB-500 | Repair | Pacific `#3A5A6A` | Deep Teal | `#2A6B6B` | Pacific + Teal |
| 3 | GHK-Cu | Repair | Pacific `#3A5A6A` | Patina | `#6B7E6B` | Pacific + Patina |
| 4 | Wolverine | Repair | Pacific `#3A5A6A` | Charcoal | `#3D3D3D` | Pacific + Charcoal |
| 5 | CL-1S | Metabolic | Ember `#B8622E` | Antique Gold | `#8A7D5A` | Ember + Gold |
| 6 | CL-2T | Metabolic | Ember `#B8622E` | Burnt Sienna | `#7A4A35` | Ember + Sienna |
| 7 | CL-3R | Metabolic | Pacific `#3A5A6A` | Pacific Blue | `#3A5A6A` | Pacific + Pacific |
| 8 | Ipamorelin | GH Axis | Slate `#5B6E8A` | Steel Blue | `#4682B4` | Slate + Steel |
| 9 | Tesamorelin | GH Axis | Slate `#5B6E8A` | Navy | `#2C3E50` | Slate + Navy |
| 10 | MOTS-c | Longevity | Eucalyptus `#7C8A78` | Sage | `#7C8A78` | Eucalyptus + Sage |
| 11 | SS-31 | Longevity | Eucalyptus `#7C8A78` | Forest | `#4A6350` | Eucalyptus + Forest |
| 12 | GLOW | Specialty | Driftwood `#8A6E5B` | Pewter Gold | `#9A9478` | Driftwood + Gold |
| 13 | KLOW | Specialty | Driftwood `#8A6E5B` | Clay | `#8E7360` | Driftwood + Clay |
| 14 | Melanotan 2 | Specialty | Driftwood `#8A6E5B` | Bronze | `#6B4E3D` | Driftwood + Bronze |
| 15 | Bac Water | Accessory | Fog `#8B9298` | Light Gray | `#B0B8BF` | Fog + Gray |

---

## Visual Quick-ID Guide

```
REPAIR (Pacific = mark):
  BPC-157    ══ Pacific     🔵 Pacific cap     — the classic
  TB-500     ══ Pacific     🟢 Teal cap        — greener
  GHK-Cu     ══ Pacific     🟤 Copper cap      — warm
  Wolverine  ══ Pacific     ⚫ Charcoal cap    — dark

METABOLIC (Ember = mark):
  CL-1S      ══ Ember       🟡 Amber cap       — lightest
  CL-2T      ══ Ember       🟠 Sienna cap      — middle
  CL-3R      ══ Pacific     🔵 Pacific cap     — signature, own identity

GH AXIS (Slate = mark):
  Ipamorelin  ══ Slate      🔵 Steel cap       — brighter
  Tesamorelin ══ Slate      🔵 Navy cap        — darker

LONGEVITY (Eucalyptus = mark):
  MOTS-c     ══ Eucalyptus  🟢 Sage cap        — matches
  SS-31      ══ Eucalyptus  🟢 Forest cap      — deeper

SPECIALTY (Driftwood = mark):
  GLOW       ══ Driftwood   🟡 Sand Gold cap   — luminous
  KLOW       ══ Driftwood   🟤 Clay cap        — earthy
  MT-2       ══ Driftwood   🟤 Bronze cap      — dark

ACCESSORY (Fog = mark):
  Bac Water  ══ Fog         ⚪ Light Gray cap  — neutral
```

---

## Design Rules

1. **`=` mark and QR code always match** — same category color on both elements
2. **Cap and crimp never match** — cap is the product color, crimp is always silver aluminum
3. **Two "signature" products** match cap to `=` mark (BPC-157 and MOTS-c) — these are the category flagships where monochrome accent reads as intentional
4. **Metabolic caps graduate dark** — CL-1S (Antique Gold/lightest) → CL-2T (Burnt Sienna/mid). CL-3R breaks from this pattern — Pacific Blue cap gives it a signature identity separate from the Metabolic graduation
5. **GHK-Cu cap is Copper** — a meaningful color choice that references the compound's copper ion
6. **All cap colors remain muted/desaturated** — no neons, no primaries, no high-saturation

---

## Variant Handling

Size variants (5mg vs 10mg, 10mg vs 30mg) share the same color combo. Only the dosage text changes. One render per product covers all variants.

| Product | Variants | Same Render? |
|---------|----------|-------------|
| BPC-157 | 5mg, 10mg | Yes — swap text |
| CL-1S | 10mg, 20mg, 30mg | Yes — swap text |
| Wolverine | 5mg, 10mg | Yes — 2-vial stack, swap text |
| Bac Water | 3mL, 10mL | Maybe different vial size |

---

## Renders Needed

| # | Product | Type | Cap Hex | `=` Hex | Status |
|---|---------|------|---------|---------|--------|
| 1 | BPC-157 | Single vial + box | `#3A5A6A` | `#3A5A6A` | Re-render (fix dosage to 5mg or 10mg) |
| 2 | TB-500 | Single vial + box | `#2A6B6B` | `#3A5A6A` | Re-render (add color) |
| 3 | GHK-Cu | Single vial + box | `#6B7E6B` | `#3A5A6A` | **NEW** |
| 4 | Wolverine | 2-vial stack + box | `#3D3D3D` | `#3A5A6A` | Re-render (add color) |
| 5 | CL-1S | Single vial + box | `#8A7D5A` | `#B8622E` | **NEW** |
| 6 | CL-2T | Single vial + box | `#7A4A35` | `#B8622E` | **NEW** |
| 7 | CL-3R | Single vial + box | `#3A5A6A` | `#3A5A6A` | Re-render (fix naming + Pacific accent + Pacific cap) |
| 8 | Ipamorelin | Single vial + box | `#4682B4` | `#5B6E8A` | **NEW** (standalone, not CJC stack) |
| 9 | Tesamorelin | Single vial + box | `#2C3E50` | `#5B6E8A` | **NEW** |
| 10 | MOTS-c | Single vial + box | `#7C8A78` | `#7C8A78` | Re-render (add color) |
| 11 | SS-31 | Single vial + box | `#4A6350` | `#7C8A78` | **NEW** |
| 12 | GLOW | Single vial + box | `#C2A878` | `#8A6E5B` | **NEW** |
| 13 | KLOW | Single vial + box | `#8E7360` | `#8A6E5B` | **NEW** |
| 14 | Melanotan 2 | Single vial + box | `#6B4E3D` | `#8A6E5B` | **NEW** |
| 15 | Bac Water | Single vial + box | `#B0B8BF` | `#8B9298` | **NEW** |

**9 new renders + 6 re-renders = 15 total**
