# CaliLean — Product Line Architecture (RUO)

> Author: CMO · Version: v3 · Date: 2026-05-01
> Companion docs: `docs/strategy/identity-brief.md`, `docs/strategy/launch-narrative.md`
> Audience: CEO (ratified), CTO (storefront IA + nav), Designer (imagery), Copywriter (per-SKU long copy).
> **v3 changeset (2026-05-01):** Lineup expanded to **15 SKUs** across 6 categories. Metabolic compounds renamed to CL- prefix for regulatory compliance. "Wolverine" replaces "Recovery Stack." GH Axis standalone SKUs replace the blended stack. SS-31 added to Longevity. Specialty blends and Supplies added. Pricing rebased.
> **Decisions in this doc are locked unless reopened by the CEO. Do not relitigate on storefront tickets.**

---

## 0. The frame

CaliLean ships **15 SKUs across 6 categories**. The lineup is larger than the original 8-SKU plan because the proof market validated demand across more pathways than anticipated. Every SKU still passes the same three filters: brand fit, literature density, and story clarity.

Posture is **research-use-only** (per [SKA-2](/SKA/issues/SKA-2)). All copy is research-context. No therapeutic claims. No "what it does for you."

---

## 1. Category structure (6 categories)

| Category | Storefront label | What it is | SKU count |
|---|---|---|---|
| **Recovery** | Recovery | Tissue, ECM, soft-tissue, gut repair research compounds. | 4 |
| **Metabolic** | Weight Management | Incretin receptor agonists for metabolic pathway research. The CL- series. | 3 |
| **GH Axis** | Growth & Anti-Aging | Growth-hormone pathway: GHRH analogs, GH secretagogues. | 2 |
| **Longevity** | Longevity | Mitochondrial function, AMPK, cellular aging. | 2 |
| **Specialty** | Cosmetic | Research blends and melanocortin compounds. | 3 |
| **Supplies** | Supplies | Reconstitution essentials. | 1 |

Storefront nav order: Recovery → Weight Management → Growth & Anti-Aging → Longevity → Cosmetic → Supplies.

---

## 2. The launch lineup (15 SKUs)

### Recovery (4)

| # | SKU | Handle | Story | Variants |
|---|---|---|---|---|
| 1 | **BPC-157** | `bpc-157` | 15-amino-acid pentadecapeptide studied in rodent models of tendon, ligament, and gut tissue repair. Janoshik tested. | 5mg, 10mg |
| 2 | **TB-500** | `tb-500` | Thymosin Beta-4 fragment studied for cell migration and ECM remodeling. Paired with BPC-157 in published soft-tissue models. | 5mg, 10mg |
| 3 | **GHK-Cu** | `ghk-cu` | Copper tripeptide studied in wound healing and cellular response. 99.97% purity verified. | 50mg, 100mg |
| 4 | **Wolverine** (BPC-157 + TB-500) | `bpc-157-tb-500-blend` | The two most-cited soft-tissue research peptides in a single vial. The Repair shelf anchor. | 5mg, 10mg |

### Metabolic / Weight Management (3) — CL- Series

> **Compliance note:** These compounds use the CL- naming convention on all public-facing surfaces. The CL- prefix is a proprietary product identifier. Generic drug names appear only in metadata `synonyms` fields and internal documentation, never in storefront titles, subtitles, or marketing copy.

| # | SKU | Handle | Receptor profile | Story | Variants |
|---|---|---|---|---|---|
| 5 | **CL-1S** | `cl-1s` | GLP-1R agonist (single) | Incretin receptor agonist for metabolic pathway and glucose homeostasis research. | 10mg, 30mg |
| 6 | **CL-2T** | `cl-2t` | GIP/GLP-1R dual agonist | Dual-incretin "twincretin" for parallel pathway investigation. | 10mg, 30mg |
| 7 | **CL-3R** | `cl-3r` | GIP/GLP-1R/GcgR triple agonist | The most mechanistically expansive metabolic research tool — three receptors, one compound. Extended COA panel (LC-MS identity confirmation). | 10mg, 30mg |

### Growth & Anti-Aging / GH Axis (2)

| # | SKU | Handle | Story | Variants |
|---|---|---|---|---|
| 8 | **Ipamorelin** | `ipamorelin` | Selective GHSR-1a agonist studied in pulsatile GH release models. | 5mg, 10mg |
| 9 | **Tesamorelin** (TH-9507) | `tesamorelin` | Synthetic GHRH analog for metabolic regulation and cellular signaling research. | 10mg, 20mg |

### Longevity (2)

| # | SKU | Handle | Story | Variants |
|---|---|---|---|---|
| 10 | **MOTS-c** | `mots-c` | Mitochondrial-derived peptide studied in AMPK signaling and metabolic homeostasis. The deep-cut that signals we read papers. | 10mg, 40mg |
| 11 | **SS-31** (Elamipretide) | `ss-31` | Mitochondria-targeted tetrapeptide for oxidative stress and cardiolipin interaction studies. | 10mg, 50mg |

### Specialty / Cosmetic (3)

| # | SKU | Handle | Story | Variants |
|---|---|---|---|---|
| 12 | **GLOW** | `glow` | Research blend: GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg). Collagen signaling and tissue remodeling. | 70mg |
| 13 | **KLOW** | `klow` | Research blend: GHK-Cu + TB-500 + BPC-157 + KPV. Collagen signaling + inflammation research. | 80mg |
| 14 | **Melanotan 2** | `melanotan-ii` | Melanocortin-receptor agonist for melanin-stimulation research. | 10mg |

### Supplies (1)

| # | SKU | Handle | Story | Variants |
|---|---|---|---|---|
| 15 | **Bac Water** | `bac-water` | Bacteriostatic water (0.9% benzyl alcohol), USP-grade. Reconstitution essential. | 3mL, 10mL |

---

## 3. CL- naming rationale

The metabolic compounds (formerly referenced by their generic pharmaceutical names) use proprietary CL- identifiers on all public-facing surfaces:

| CL Code | Receptor profile | Internal reference |
|---|---|---|
| CL-1S | Single (GLP-1R) | See metadata synonyms |
| CL-2T | Two receptors (GIP + GLP-1R) | See metadata synonyms |
| CL-3R | Three receptors (GIP + GLP-1R + GcgR) | See metadata synonyms |

**Why:** Regulatory compliance. Generic drug names on a storefront invite scrutiny from platforms and agencies. The CL- system communicates receptor count to informed researchers without triggering automated compliance flags. The naming convention is: `CL-[number of receptors][first letter of distinguishing feature]`.

---

## 4. Naming and labeling rules

1. **Generic / chemical name first, brand-friendly framing in the subtitle.** Exception: CL- series uses proprietary codes as titles.
2. **Blends are named for the use case, not the molecules.** Right: `Wolverine`. Wrong: `BPC-157 / TB-500 Blend`. Molecules go in description and COA.
3. **No mg in the title.** Mg goes in the variant selector. Title is the compound, variant is the dose.
4. **No therapeutic claims in titles or subtitles.** Subtitles describe the receptor profile or research application.
5. **CAS number, molecular weight, and PubChem ID render on the PDP** (in metadata).
6. **CL- series: never use generic drug names in any customer-facing copy.** Internal docs may reference them for clarity.

---

## 5. Pricing direction

### 5.1 Current pricing (v3)

| SKU | Variant(s) | Price |
|---|---|---|
| BPC-157 | 5mg, 10mg | TBD (placeholder $1) |
| TB-500 | 5mg, 10mg | TBD (placeholder $1) |
| GHK-Cu | 50mg, 100mg | TBD |
| Wolverine | 5mg, 10mg | **$199** |
| CL-1S | 10mg, 30mg | **$159** |
| CL-2T | 10mg, 30mg | **$159** |
| CL-3R | 10mg, 30mg | **$179** |
| Ipamorelin | 5mg, 10mg | **$35** |
| Tesamorelin | 10mg, 20mg | **$179** |
| MOTS-c | 10mg, 40mg | TBD (placeholder $3) |
| SS-31 | 10mg, 50mg | **$129** |
| GLOW | 70mg | TBD (placeholder $1) |
| KLOW | 80mg | TBD (placeholder $1) |
| Melanotan 2 | 10mg | TBD |
| Bac Water | 3mL, 10mL | **$10** |

> **Note:** Several SKUs still carry placeholder pricing from the seed data. Final pricing to be set by CEO before launch based on COGS + margin targets. The v2 pricing philosophy (premium index, round-to-9, no discounting) remains directionally correct.

### 5.2 Pricing principles (carried from v2)

- Premium index over seed/competitor pricing. Trust-shopping audience, not price-shopping.
- Round to last-digit-9 when final prices are set.
- No discounting in the first 90 days.
- CL-3R carries a premium over CL-1S and CL-2T (triple agonist = most-scrutinized, highest COA cost).

---

## 6. Storefront IA — what CTO ships

```
Home shelf (above the fold, "Pathways" view):
  Recovery       → BPC-157, TB-500, GHK-Cu, Wolverine
  Weight Mgmt    → CL-1S, CL-2T, CL-3R
  Growth & Aging → Ipamorelin, Tesamorelin
  Longevity      → MOTS-c, SS-31
  Cosmetic       → GLOW, KLOW, Melanotan 2
  Supplies       → Bac Water

Nav order:
  Recovery → Weight Management → Growth & Anti-Aging → Longevity → Cosmetic → Supplies
```

The storefront uses Medusa product categories with a hierarchical structure. Products are assigned to categories via the admin API and rendered dynamically by the `categorized-products.tsx` template.

---

## 7. Status of decisions (v3)

### Locked

| # | Decision | Status |
|---|---|---|
| 1 | 15-SKU lineup as documented above | **Locked** |
| 2 | CL- naming convention for metabolic series | **Locked** |
| 3 | 6-category structure (Recovery / Weight Mgmt / Growth & Anti-Aging / Longevity / Cosmetic / Supplies) | **Locked** |
| 4 | Naming and labeling rules in §4 | **Locked** |
| 5 | "Wolverine" as the Recovery blend name | **Locked** |

### Open

| # | Item | Owner | Notes |
|---|---|---|---|
| A | Final pricing for placeholder SKUs (BPC-157, TB-500, MOTS-c, GLOW, KLOW) | CEO | Blocking launch |
| B | Product imagery for CL-1S, CL-2T, SS-31, Bac Water (no thumbnails) | Designer | Blocking storefront visual completeness |
| C | Extended COA panel spec for CL-3R | CTO / Ops | LC-MS identity confirmation per batch |
| D | RUO attestation + checkout compliance | CTO ([SKA-2](/SKA/issues/SKA-2)) | Hard gate before launch |

---

## Changelog

- **v3 (2026-05-01)** — Full rewrite. Lineup expanded from 8 to 15 SKUs. Categories restructured to 6. Metabolic compounds renamed to CL- series (compliance). "Recovery Stack" → "Wolverine." GH Axis Stack eliminated; Ipamorelin and Tesamorelin sold standalone. SS-31, GHK-Cu, GLOW, KLOW, Melanotan 2, Bac Water added. Pricing rebased to current seed data.
- **v2 (2026-04-26)** — [Archived at `archive/product-architecture-v2.md`] Day 0 lineup expanded from 6 to 8 SKUs.
- **v1 (2026-04-26)** — Initial 6-SKU architecture.
