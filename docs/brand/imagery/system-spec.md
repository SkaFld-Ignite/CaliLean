# CaliLean — Imagery System v0

**Owner:** Designer
**Tracking:** [SKA-14](/SKA/issues/SKA-14)
**Built against:** [identity-brief.md](../identity-brief.md) §5 (Visual moodboard direction), §7 (Color)
**Posture:** RUO (research-use-only, locked 2026-04-26 — see [SKA-1](/SKA/issues/SKA-1) cascade)
**Status:** v0 — system spec only. No production renders until image-gen API credentials land.

This document is the contract for any image that ships with the CaliLean wordmark on it. If a render fails one of the rules below, kick it back. The point of a system is that we never have to re-argue these decisions per shoot.

---

## 1. The reframe — RUO, not telehealth-Rx

Identity brief §1 was written assuming telehealth-Rx posture. Board flipped to **RUO** on 2026-04-26. That changes the imagery posture in three concrete ways:

| Was (Rx posture) | Now (RUO posture) |
| --- | --- |
| Athletes mid-effort on the Strand, hero | Lab + bench + COA documents, hero |
| "Recovery / leanness / longevity" lifestyle | "Reference materials / lot-controlled / assayed" research |
| Clinician-fronted (Dr. Name, MD overlays) | Researcher-fronted (lot # / batch # / date overlays) |
| Vials in a kitchen with a French press | Vials on lab bench with a pipette and a printed COA |
| Skin, sweat, sand | Glass, paper, brushed steel |

We keep the **coastal restraint** — May Gray light, salt-bleached palette, absence of orange grading. We lose the explicit athlete-narrative photography from the v1 brief. Lifestyle still exists but moves to **secondary/social**, not hero.

Anti-references stay the same: not Bluum, not Goop, not GymShark, not generic biohacker utility. Add one more: **not a stock-image medical lab** (white coats, blue gloves, beakers with green liquid — gray-market peptide TikTok aesthetic).

---

## 2. Surface taxonomy

Five surfaces. Each has distinct rules so we never confuse a hero with a PDP shot.

| Surface | Use | Aspect | Min long edge | Format | Notes |
| --- | --- | --- | --- | --- | --- |
| **Hero / campaign** | Homepage hero, OOH, OG card | 16:9 (web), 4:5 (social) | 2400px | AVIF + JPG fallback | One per quarter. Real photography preferred. AI only if marked "research render." |
| **PDP — primary** | First product image on PDP | 1:1 | 2000px | AVIF + JPG | On-white top-down, surgical. Vial centered, lot-label visible, COA chip in corner. |
| **PDP — gallery** | Slots 2–5 on PDP | 1:1 | 2000px | AVIF + JPG | Macro detail, scale reference (US quarter or pipette tip), packaging, document overlay. |
| **PDP — context** | Slot 6+ "in research" | 4:5 | 2000px | AVIF + JPG | Vial on bench. No human hands in v0. |
| **Editorial / blog** | Education hub, COA explainers | 3:2 | 1800px | AVIF + JPG | Document-forward. Pages, calipers, micropipettes. |
| **Lifestyle / social** | IG, email, retargeting | 4:5 (social), 1:1 (grid) | 1600px | JPG | Coastal-restraint, demoted from hero. Real photography only — no AI humans. |

**Hard rule:** every image ships with a 1:1 derivative for grid/social. Cropping is part of the spec, not an afterthought.

---

## 3. Light

The brief calls May Gray and June Gloom "signature, not a problem to fix." Concretely:

- **Color temperature:** 5400–5800K. Cool-leaning daylight. Never tungsten.
- **Direction:** Soft top-or-side. No hard direct sun on product. No flash.
- **Contrast:** Low. Shadow density target around 60% of black, not 90%. Highlights never blown.
- **Time of day (lifestyle):** Pre-dawn through 9am, or 5pm through last light. Skip 11am–3pm entirely.
- **LUT for raster:** cool-leaning neutral, slight green-cyan in shadows, retain skin warmth, never push contrast (carry-over from §5 of brief).

For lab/bench shots specifically: simulate "north-window daylight" — diffuse, no shadow drama.

---

## 4. Surface (the literal physical surface a product sits on)

Three approved surfaces. Pick one per shoot, never mix.

1. **Salt linen** — a heavyweight cotton/linen blend in the Salt token (`#F4F2EC`). Slight texture. Default for PDP primary.
2. **Brushed stainless** — fine-grit brushed 304 steel, cool. Reads "lab bench." Default for PDP context and editorial.
3. **White ceramic tile** — large-format unglazed ceramic with a 4mm grout line. Architectural. Reserve for hero only.

Anti-surface list: **no wood grain, no marble, no concrete with cracks, no slate, no neoprene gym mat, no kitchen counter, no sand/towel.**

---

## 5. Palette (image-side)

Inherits **Palette A — Salt & Iron** from brief §7. Rules for imagery specifically:

| Token | Hex | Use in imagery |
| --- | --- | --- |
| Salt | `#F4F2EC` | Primary background. >70% of any PDP frame. |
| Iron | `#1F2326` | Wordmark, label type, COA print. |
| Pacific | `#3A5A6A` | Vial cap accent (one product family) + COA chip color. |
| Eucalyptus | `#7C8A78` | Vial cap accent (second product family). Editorial sage sprig. |
| Coral | `#D9624A` | RUO/research callout sticker only. Never decorative. |

- **One accent per frame.** A bottle with a Pacific cap shot on Salt linen with no Eucalyptus anywhere.
- **Saturation budget:** total color saturation in frame should average <25% (HSL). The frame should look almost colorless and let the product earn the page.
- **Skin** (when present in lifestyle): real, sun-aged, not retouched flat. Carry-over from brief.

---

## 6. The product (what's actually in the frame)

CaliLean's research products are vialled compounds. The visual unit is:

- **2ml clear glass vial**, lyophilized contents (pale beige to white powder, depending on compound).
- **Crimp-seal aluminum cap**, color = product family accent (Pacific or Eucalyptus per §5).
- **Wraparound label** in Iron type on Salt stock. Compound name in Söhne, dosage in Söhne Mono, lot # in Söhne Mono. No icons, no decoration.
- **Outer carton** (for the few SKUs that ship with one): rigid kraft-feel paperboard in Salt, single-color print in Iron, internal dunnage in unbleached molded pulp.

Every PDP primary shows: **one vial + one carton (if applicable) + lot/COA chip.** Nothing else. No pipette, no syringe, no sage sprig — those are gallery slots, not the primary.

---

## 7. Composition rules

- **PDP primary** is top-down (90° camera) over the surface. Vial dead-center. Carton (if shown) sits at 5° left rotation, vial overlaps carton's right third by 15%. No prop within 80% of the long edge.
- **PDP gallery** uses one of three approved compositions per gallery slot:
  - *Macro label*: 4× crop into the wraparound label, lot # readable.
  - *Scale ref*: top-down with a single US quarter (or 10mm reference bar) at lower-right.
  - *COA pair*: vial standing upright, COA printout to its right at 45°.
- **PDP context** is 3/4 perspective at +25° camera height. Vial on brushed stainless, with a single inert prop: a closed pipette, a folded COA page, or a batch tag. Never two props.
- **Hero** is the one place we earn a wider scene. Approved hero compositions:
  - *Bench*: long shot of a research bench, vials racked, COA pages, May Gray window light. No human.
  - *Coastal abstract*: salt linen + a single vial + a horizon line (real photography of South Bay coast).
  - *Document still life*: a printed protocol page, a vial, a pen. Editorial.

**Negative space rule:** every PDP primary has at least 35% Salt-tone negative space. If the frame feels full, recompose.

---

## 8. Type-on-image (overlays, labels, COA chips)

- Wordmark on imagery: never larger than 12% of long edge. Never colored. Never rotated. Never with drop shadow.
- Lot numbers and dosages: always in Söhne Mono, set to 1.0× line height, tracked at 0 (no positive tracking on mono).
- COA chip: 84×24px at 2000px-wide canvas, Pacific (`#3A5A6A`) fill, Salt type. Reads `COA · LOT 24-0438` or similar. Sits 3% from corner.
- RUO sticker (when required): Coral fill, Salt type, `RUO · NOT FOR HUMAN USE`. PDP context and editorial only — never on hero or lifestyle. Compliance gates this; do not move without legal sign-off.

---

## 9. The repeatability test

The brief calls out: *"Imagery system must be repeatable so new products do not require a fresh photoshoot."* Concretely, "repeatable" means:

> A new SKU can join the line in **one production day** (≤4 hours render + ≤2 hours QA + ≤1 hour copy/COA chip generation), using only:
> - the vector packaging template ([templates/](./templates/))
> - the prompt-engineering brief ([prompts/](./prompts/))
> - the lot/COA chip generator (TBD, depends on backend lot system)
> - one approved color accent (Pacific or Eucalyptus)

If a new SKU requires a fresh shoot, a fresh prompt set, or a fresh palette token, the system has failed. Kick it back to me.

---

## 10. What's in this directory

```
docs/brand/imagery/
  ├─ system-spec.md            ← you are here
  ├─ templates/
  │   ├─ pdp-primary-grid.svg  ← the on-canvas grid for PDP primary (2000×2000)
  │   ├─ vial-template.svg     ← parametric vial+label, edit text + cap color
  │   └─ coa-chip.svg          ← the COA chip overlay
  └─ prompts/
      └─ image-gen-brief.md    ← prompt-engineering brief for gpt-image-1 (or alt provider)
```

## 11. Production gate (what's blocked and what's not)

| Deliverable | Status | Gate |
| --- | --- | --- |
| System spec (this doc) | ✅ done v0 | — |
| Vector packaging template | ✅ done v0 | — |
| Image-gen prompt brief | ✅ done v0 | — |
| Lifestyle reshoot (real photography) | 🔲 | photographer hire (CMO + CEO) |
| Top-8 PDP renders | 🔲 | gpt-image-1 API key (CEO + ops) |
| Hero campaign image | 🔲 | photographer hire (preferred) OR gpt-image-1 (fallback, editorial only) |
| MinIO bucket layout | 🔲 | CTO coordination — see ticket cut from this issue |

## 12. Handoff

When v0 unblocks production, this spec hands off to:

- **CTO** — for `/storefront/public/products/<sku>/<surface>.<ext>` integration and MinIO upload helpers.
- **CMO** — for caption/alt-text language consistent with brief voice (§3).
- **Designer (me)** — for prompt iteration and approval of every render before it ships.
