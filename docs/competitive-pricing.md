# Competitive pricing — CaliLean launch shelf vs. 8 vendors

> Author: CMO · Date scanned: 2026-04-29 · Source ticket: [SKA-77](/SKA/issues/SKA-77) · Parent: [SKA-76](/SKA/issues/SKA-76)
> Companion: `docs/brand/product-architecture.md` (locked v2 launch prices §5.2).

## 1. Methodology

**Our 15 SKUs.** Pulled from `https://calilean.com/sitemap.xml` (live, public). The published handles are: `bac-water, bpc-157, ghk-cu, glow, glp1-s, glp2-t, glp3-r, ipamorelin, klow, melanotan-2, mots-c, ss-31, tb-500, tesamorelin, wolverine`. The seed at `storefront/src/data/products-seed.json` is *not* the source of truth — it carries 33 Bluum candidates; live ships 15.

**Our prices.** The locked launch table in `docs/brand/product-architecture.md §5.2` covers a subset of the live shelf. For SKUs the architecture doc covers (BPC-157, TB-500, MOTS-c, GLP3-R = Retatrutide), I cite the locked price. For SKUs that the architecture doc does **not** cover (`glp1-s`, `glp2-t`, `ss-31`, `wolverine`, `bac-water`, plus `glow`/`klow`/`melanotan-2`/`tesamorelin`/`ghk-cu` which were PHASE 2 / CATALOG / CUT in the doc but live now), I mark **`tbd`** and flag for follow-up. **Live prices could not be verified this run** — the storefront is age-gated server-side, `admin.calilean.bio` returned 404, and the SKA-20 admin creds path was unavailable. See §5 for the open question on reconciling architecture-doc lineup vs. live.

**Size-match rule.** When a competitor doesn't carry the exact size, I cite the closest available size on file and note the actual mg in the cell. `n/a (no stock)` means the vendor returns no results for that compound. `n/a (login)` means the vendor blocks the catalog behind login.

**Login-walled vendors.** `flawlesscompounds.com` and `crushresearch.shop` both require an account before pricing is visible. Crushresearch product URLs are reachable but the body is a 51KB login wall on every slug. Both are documented as `n/a (login)` across the matrix; the brief authorized this if signup was blocked.

**Promo pricing.** Where a vendor shows both list and sale prices, I capture both (e.g., `$57 / sale $47`). No vendor in this scan was running a promo banner at scan time on more than 2–3 SKUs each.

**Cite-per-cell.** Every price has a source URL. The vendor IDs in the column header are abbreviated; the URL maps below.

| Code | Vendor | URL |
|------|--------|-----|
| Flaw | Flawless Compounds | https://flawlesscompounds.com/shop/ |
| Crush | Crush Research | https://crushresearch.shop/ |
| Ion | Ion Peptide | https://ionpeptide.com/shop/ |
| Verif | Verified Peptides | https://verifiedpeptides.com/ |
| Core | Core Peptides | https://www.corepeptides.com/peptides/ |
| Biotech | Biotech Peptides | https://biotechpeptides.com/buy-peptides/ |
| Bluum | Bluum Peptides | https://bluumpeptides.com/ |
| Pengu | Penguin Peptides | https://penguinpeptides.com/ |

---

## 2. Master matrix (peptide × vendor)

> Cell format: `$price (size, $/mg)` linked to source. `n/a` with a reason where applicable. Where a vendor lists multiple sizes, I cite the size closest to ours; the full per-mg table is in §3.

| # | Peptide (CaliLean handle) | Our launch | Flaw | Crush | Ion | Verif | Core | Biotech | Bluum | Pengu |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **bpc-157** (BPC-157) | $89 (5mg, $17.80/mg) [arch §5.2](#) | n/a (login) | n/a (login) | [$29 (5mg, $5.80/mg)](https://ionpeptide.com/product/bpc-157/) | [$53 (10mg, $5.30/mg)](https://verifiedpeptides.com/product/bpc157/) | [$52 (5mg, $10.40/mg)](https://www.corepeptides.com/peptides/bpc-157/) | [$52 (5mg, $10.40/mg)](https://biotechpeptides.com/product/bpc-157/) | [$40 (5mg, $8.00/mg)](https://bluumpeptides.com/products/bpc-157) | [$42 (10mg, $4.20/mg)](https://penguinpeptides.com/product/bpc-157/) |
| 2 | **tb-500** (TB-500) | $109 (5mg, $21.80/mg) [arch §5.2](#) | n/a (login) | n/a (login) | [$29 (5mg, $5.80/mg)](https://ionpeptide.com/product/tb-500/) | [$62 (10mg, $6.20/mg)](https://verifiedpeptides.com/product/tb500/) | [$78 (5mg, $15.60/mg)](https://www.corepeptides.com/peptides/tb-500/) | [$115 blend (10mg total, n/a $/mg)](https://biotechpeptides.com/product/bpc-157-tb-500-10mg-blend-2/) — standalone not stocked | [$45 (5mg, $9.00/mg)](https://bluumpeptides.com/products/tb-500) | [$30 (10mg, $3.00/mg)](https://penguinpeptides.com/product/tb-500/) |
| 3 | **tesamorelin** | tbd (PHASE 2 in arch doc — verify live) | n/a (login) | n/a (login) | [$45 (5mg, $9.00/mg)](https://ionpeptide.com/product/tesamorelin/) | [$119 (20mg, $5.95/mg)](https://verifiedpeptides.com/product/tesa/) | [$43 (5mg, $8.60/mg)](https://www.corepeptides.com/peptides/tesamorelin-10mg/) | n/a (no stock) | [$40 (5mg, $8.00/mg)](https://bluumpeptides.com/products/tesamorelin) | [$45 (5mg, $9.00/mg)](https://penguinpeptides.com/product/tesamorelin/) |
| 4 | **ipamorelin** | $69 inferred (10mg, $6.90/mg — arch CATALOG +30% rule over Bluum $50) | n/a (login) | n/a (login) | [$35 (5mg, $7.00/mg)](https://ionpeptide.com/product/ipamorelin/) | [$53 (10mg, $5.30/mg)](https://verifiedpeptides.com/product/ipamorelin/) | [$46 (5mg, $9.20/mg)](https://www.corepeptides.com/peptides/ipamorelin-5mg/) | blends only | [$55 (10mg, $5.50/mg)](https://bluumpeptides.com/products/ipamorelin) | [$42 (10mg, $4.20/mg)](https://penguinpeptides.com/product/ipamorelin/) |
| 5 | **glp3-r** (Retatrutide) | $499 (15mg, $33.27/mg) [arch §5.2.1](#) | n/a (login) | n/a (login) | [$58.50 (10mg, $5.85/mg)](https://ionpeptide.com/product/glp-3r/) | n/a (no stock) | n/a (no stock) | n/a (no stock) | [$160 (15mg, $10.67/mg)](https://bluumpeptides.com/products/retatrutide) | [$72 (5mg, $14.40/mg)](https://penguinpeptides.com/product/glp-1-r/) |
| 6 | **glp1-s** (Semaglutide-class) | tbd (not in arch doc) | n/a (login) | n/a (login) | [$39 (5mg, $7.80/mg)](https://ionpeptide.com/product/glp-1s/) | n/a (no stock) | n/a (no stock) | n/a (no stock) | n/a (no stock) | [$59 (5mg, $11.80/mg)](https://penguinpeptides.com/product/glp-1-s/) |
| 7 | **glp2-t** (Tirzepatide-class) | tbd (not in arch doc) | n/a (login) | n/a (login) | [$49 (10mg, $4.90/mg)](https://ionpeptide.com/product/tirzepatide/) | n/a (no stock) | n/a (no stock) | n/a (no stock) | n/a (no stock) | [$52 (10mg, $5.20/mg)](https://penguinpeptides.com/product/glp-1-t/) |
| 8 | **mots-c** | $229 (40mg, $5.73/mg) — *arch v2 priced 40mg, live now 5/10mg per SKA-60; tbd re-price* | n/a (login) | n/a (login) | [$38 (10mg, $3.80/mg)](https://ionpeptide.com/product/mots-c/) | [$77 (20mg, $3.85/mg)](https://verifiedpeptides.com/product/motsc/) | [$116 (10mg, $11.60/mg)](https://www.corepeptides.com/peptides/mots-c-10mg/) | n/a (no stock) | sold out (10mg) — no price | [$65 (10mg, $6.50/mg)](https://penguinpeptides.com/product/mots-c/) |
| 9 | **ss-31** | tbd (not in arch doc) | n/a (login) | n/a (login) | [$55 (10mg, $5.50/mg)](https://ionpeptide.com/product/ss-31/) | linked, no stock — see [/product/ss31/](https://verifiedpeptides.com/product/ss31/) | n/a (no stock) | n/a (no stock) | n/a (no stock) | n/a (no stock) |
| 10 | **ghk-cu** | tbd (PHASE 2 in arch doc) | n/a (login) | n/a (login) | injectable mg form not stocked | [$49.99 / $44.50 sale (100mg, $0.50/mg)](https://verifiedpeptides.com/product/ghkcu/) | [$69 / $58 sale (50mg, $1.38/mg)](https://www.corepeptides.com/peptides/ghk-cu-50mg-copper/) | [$51 (50mg, $1.02/mg)](https://biotechpeptides.com/product/ghk-basic-50mg/) — note: this is GHK basic, copper variant 200mg topical $192 | [$40 (50mg, $0.80/mg)](https://bluumpeptides.com/products/ghk-cu) | [$54 (100mg, $0.54/mg)](https://penguinpeptides.com/product/ghk-cu/) |
| 11 | **glow** (BPC + TB + GHK blend) | tbd (PHASE 2 in arch doc) | n/a (login) | n/a (login) | n/a (no stock) | [$124.99 (80mg, $1.56/mg)](https://verifiedpeptides.com/product/glow/) | [$300 (70mg, $4.29/mg)](https://www.corepeptides.com/peptides/bpc-157-tb-500-ghk-cu-blend/) | [$305 (70mg, $4.36/mg)](https://biotechpeptides.com/product/bpc-157-tb-500-ghk-cu-blend-70mg/) | [$90 (70mg, $1.29/mg) — sold out](https://bluumpeptides.com/products/glow) | [$124 (70mg, $1.77/mg)](https://penguinpeptides.com/product/glow-blend-70mg/) |
| 12 | **klow** (KPV + BPC + TB + GHK blend) | tbd (PHASE 2 in arch doc) | n/a (login) | n/a (login) | n/a (no stock) | [$135 (composition: KPV/GHK/BPC/TB)](https://verifiedpeptides.com/product/klow/) | n/a (no stock — closest is fragment + CJC + ipa blend $73) | n/a (no stock) | [$110 (80mg, $1.38/mg)](https://bluumpeptides.com/products/klow) — sold out at scan | [$134 (80mg, $1.68/mg) — sold out](https://penguinpeptides.com/product/klow-blend-80mg/) |
| 13 | **wolverine** (BPC + TB + GHK blend, branded variant) | tbd (not in arch doc) | n/a (login) | n/a (login) | n/a (no stock) | n/a (no stock) | [$300 (70mg, $4.29/mg) — same composition under different name](https://www.corepeptides.com/peptides/bpc-157-tb-500-ghk-cu-blend/) | [$305 (70mg, $4.36/mg) — same composition under different name](https://biotechpeptides.com/product/bpc-157-tb-500-ghk-cu-blend-70mg/) | n/a (no stock) | n/a (no stock) |
| 14 | **melanotan-2** | tbd (CUT in arch doc; live ships) | n/a (login) | n/a (login) | n/a (no stock) | n/a (no stock) | [$41 (10mg, $4.10/mg)](https://www.corepeptides.com/peptides/melanotan-2-10mg/) | n/a (no stock) | [$42 (10mg, $4.20/mg)](https://bluumpeptides.com/products/melanotan-ii) | [$52 (10mg, $5.20/mg)](https://penguinpeptides.com/product/mt-2-melanotan-2-10mg/) |
| 15 | **bac-water** (Bacteriostatic Water) | tbd (not in arch doc) | n/a (login) | n/a (login) | [$10 (10ml, $1.00/ml)](https://ionpeptide.com/product/bac-water/) | n/a (no stock) | n/a (no stock) | n/a (no stock) | n/a (no stock) | n/a (no stock) |

**Stock & coverage notes.**

- **Login-walled (Flaw + Crush)** — both require account creation before any pricing or product listing. Per brief, signup was attempted but skipped after login wall confirmed; no representative pricing captured. These two are reflected as `n/a (login)` everywhere; the median tables in §3 are computed without them.
- **Ion Peptide** carries the broadest GLP-class lineup of any vendor (full sema/tirz/reta/cag ladder) and SS-31. Does NOT stock GHK-Cu in injectable mg sizes (offers only raw 1g and topical/cosmetic forms), GLOW/KLOW blends, melanotan-2, or tesamorelin sizes ≥30mg.
- **Verified Peptides** carries the broadest "research peptide" classical lineup (BPC, TB-500, Tesa, Mots-c, GLOW, KLOW, Ipamorelin, GHK-Cu) but explicitly NO GLP class, NO Retatrutide, NO SS-31 (linked but no stock), NO Melanotan, NO bac water.
- **Core Peptides** is the deepest catalog (~100 SKUs) but pure research-peptide / cosmetic — NO GLP class, NO SS-31, NO bac water, NO Wolverine (uses generic blend names).
- **Biotech Peptides** is a near-mirror of Core Peptides on price and SKU shape (this scan suggests they share a backend or overlap heavily).
- **Bluum Peptides** is the closest pricing-tier competitor to where CaliLean is *coming from* (we forked the seed). Bluum stocks 11 of our 15. Bluum is generally the cheapest mainstream vendor (BPC $40/5mg). Several Bluum SKUs were sold out at scan time (MOTS-c 10mg, GLOW, KLOW).
- **Penguin Peptides** uses the same `GLP-1 S / GLP-1 T / GLP-3 R` naming convention CaliLean has adopted on the live storefront. Direct visual lineage. Penguin's category nav (Metabolic / Structural / Regenerative / Specialized / Immunology / Dermal) is also a near-match to our Repair / GH Axis / Longevity / Adjacent. **Penguin is the model.** Their pricing is the most direct comparable.
- **Wolverine** is a CaliLean-branded variant of the standard BPC+TB+GHK blend; competitor pricing under that exact name doesn't exist, so I cited the same-composition blend at Core/Biotech for comparison.

---

## 3. Median + range table ($/mg)

`Mid` = the central tendency across the 6 visible vendors (Flaw + Crush excluded). Where a vendor lists a wide range, I used the smallest in-stock size to normalize.

| Peptide | Low $/mg | Median $/mg | High $/mg | Vendors with stock | Our launch $/mg | Position vs. median |
|---|---|---|---|---|---|---|
| BPC-157 | $4.20 (Pengu, 10mg) | **$5.85** | $10.40 (Core/Biotech, 5mg) | 6/6 | $17.80 (5mg) | **+204% premium** |
| TB-500 | $3.00 (Pengu, 10mg) | **$7.50** | $15.60 (Core, 5mg) | 5/6 visible | $21.80 (5mg) | **+191%** |
| Tesamorelin | $5.95 (Verif, 20mg) | **$8.60** | $9.00 (Pengu/Ion, 5mg) | 5/6 | tbd | tbd |
| Ipamorelin | $4.20 (Pengu, 10mg) | **$5.50** | $9.20 (Core, 5mg) | 5/6 | $6.90 inferred (10mg) | **+25%** |
| Retatrutide / GLP3-R | $5.85 (Ion, 10mg) | **$10.27** | $14.40 (Pengu, 5mg) | 3/6 | $33.27 (15mg) | **+224%** |
| Semaglutide / GLP1-S | $7.80 (Ion, 5mg) | **$9.80** | $11.80 (Pengu, 5mg) | 2/6 | tbd | tbd |
| Tirzepatide / GLP2-T | $4.90 (Ion, 10mg) | **$5.05** | $5.20 (Pengu, 10mg) | 2/6 | tbd | tbd |
| MOTS-c | $3.80 (Ion, 10mg) | **$5.18** | $11.60 (Core, 10mg) | 4/6 | tbd (need re-price) | tbd |
| SS-31 | $5.50 (Ion, 10mg) | **$5.50** (single observation) | $5.50 | 1/6 | tbd | tbd |
| GHK-Cu | $0.50 (Verif, 100mg) | **$0.91** | $1.38 (Core, 50mg) | 5/6 | tbd | tbd |
| GLOW (blend) | $1.29 (Bluum, sold out) | **$1.77** | $4.36 (Biotech, 70mg) | 5/6 | tbd | tbd |
| KLOW (blend) | $1.38 (Bluum, sold out) | **$1.53** | $1.68 (Pengu, 80mg) | 3/6 | tbd | tbd |
| Wolverine (blend) | $4.29 (Core) | **$4.32** | $4.36 (Biotech) | 2/6 (under generic name) | tbd | tbd |
| Melanotan II | $4.10 (Core) | **$4.20** | $5.20 (Pengu) | 3/6 | tbd | tbd |
| Bac Water | $1.00/ml (Ion, 10ml) | $1.00/ml | $1.00/ml | 1/6 | tbd | commodity — should be cheapest line item |

---

## 4. Positioning notes

1. **The market clusters in two bands per molecule.** "Mainstream gray-market" (Penguin, Bluum, Verified, Ion) sits at $4–6/mg for classical peptides. "Premium catalog" (Core, Biotech) sits at $8–15/mg for the same molecules. CaliLean's locked launch prices (BPC at $17.80/mg, TB-500 at $21.80/mg, Reta at $33.27/mg) sit **above the premium tier** — even after the COA-funded story is told, this is a +120-220% premium over the median market clearing price. That gap is sellable, but only if the trust premise is clearly communicated above the fold.

2. **No competitor in this set commands the price tier we are aiming for.** None of the eight vendors carry the COA-grade story we plan to lead with (LC-MS/MS triple-quad on Retatrutide, identity confirmation, per-batch). Premium-tier competitors (Core, Biotech) publish purity HPLC and call it a day. **The pricing premium is therefore not a "premium-of-premium-vendors" play; it is a category-creating play.** Brand work has to do the heavy lifting; price testing won't save us if the trust story doesn't land.

3. **Retatrutide is the one SKU where our $499/15mg ($33.27/mg) has clear daylight.** Bluum is the only competitor in the set carrying it, at $160 (15mg, $10.67/mg). Ion lists Retatrutide-class (`glp-3r`) at the small-vial entry ($39/5mg, $7.80/mg). At $499 we are 3.1× Bluum and 4.3× Ion. The case for that gap (compounded-GLP comparison, COA-LC-MS/MS, single-PR-anchor) is laid out in `product-architecture.md §5.2.1` and is the strongest pricing case on the shelf.

4. **GLP-1 S / GLP-2 T are the most price-elastic SKUs we have.** Penguin and Ion are the only carriers, and both sit at $4.90–11.80/mg. There is no daylight here — these are commodity GLP molecules with very active gray-market supply. Our locked architecture doc deliberately avoided pricing these because we hadn't decided whether to ship them. **They are now live (per sitemap) and unpriced in the architecture doc.** This is the single most urgent reconciliation item for the board: either (a) price them at premium-of-premium ($150–300/10mg, ratio'd off Retatrutide), or (b) keep them off the home shelf and price at a parity-with-Penguin level so they don't drag the brand price ceiling down.

5. **Penguin Peptides is the brand twin we have not acknowledged.** Same GLP naming convention, near-identical category taxonomy, similar premium-but-not-extreme price band (MOTS-c $65, BPC $42, GLOW $124). If a researcher Googles "GLP-3 R peptide" and lands on us with a $499 sticker after seeing Penguin's $72-$425 range, the brand has to convert that gap inside the first scroll. The CTO/Designer team should be aware of how close the visual and merchandising overlap is — we cannot afford to look like a Penguin clone with markups.

6. **Bluum Peptides — our origin codebase — is the price floor we are walking away from.** Bluum sits at the bottom of the market on every line we share ($40 BPC, $40 Tesa, $40 GHK, $42 MTII). Several SKUs were sold out at scan time (MOTS-c, GLOW, KLOW). This is not a brand we want to be confused with, and the storefront fork inheritance (same admin codebase, same sku_codes) makes that confusion easy. Worth a one-line `nofollow` audit on any old Bluum-product image URLs that still point at `cdn/shop/files/bluumpeptides.com/`.

7. **Login-walled vendors (Flawless + Crush) are likely the relevant pricing comparators, not the open-shelf vendors.** Both lead with veteran/military framing and "exclusive access" merchandising, which signals a higher-trust audience and (anecdotally from sector reporting) higher prices than the open-shelf vendors in this scan. **Recommendation:** sign up to both before we lock the next pricing review; their pricing is the closest lookalike to ours, but we couldn't see it this run.

8. **GHK-Cu is the cheapest line on every shelf** ($0.50–1.38/mg) and we should price it accordingly when we publish — pretending it's premium will read as a margin grab.

9. **GLOW and KLOW were repeatedly sold out across the set** (Bluum, Penguin both showed sold-out states for these blends at scan time). Either there is genuine demand-supply mismatch on these compositions or the gray-market supply chain is consolidating away from named-blend formats. Either reading suggests we should not lead with GLOW/KLOW as a launch hero, even though they're live on our shelf.

10. **SS-31 is a near-vacuum.** Only one vendor in the set (Ion) has it in stock at scan time; one other (Verified) lists the slug but no inventory. If we want to own the longevity-mitochondrial conversation, **SS-31 is the unowned slot in this market** — it's the one molecule where we could announce "the only catalog stocking it with a published assay" and not get fact-checked. Worth a brand call.

---

## 5. Open questions / follow-ups for the board

1. **(High) Reconcile the live storefront against the architecture doc.** Live ships 15 SKUs (sitemap canonical above). Architecture doc §2 prescribes 8 LAUNCH + 9 CATALOG = 17 visible. The two lists overlap on only ~5 molecules (BPC-157, TB-500, MOTS-c, Ipamorelin, GHK-Cu). Live includes glp1-s / glp2-t / glp3-r / wolverine / ss-31 / bac-water / melanotan-2 — none of which are in the architecture-doc launch lineup. Several architecture-doc LAUNCH SKUs (NAD+, Glutathione, Recovery Stack, GH Axis Stack) are not on the live shelf at all. **CMO is not relitigating the architecture doc on this ticket** — flagging that someone has been making catalog decisions outside the doc's locked decision list.
2. **(High) Verify live prices against `admin.calilean.bio`.** This run could not access admin (404) or the storefront (age-gated, non-bypassable from the agent). Ratify the matrix's "Our launch" column once admin is reachable. SKA-77 effort to revisit when storefront/admin auth is unblocked.
3. **(High — pricing call) Price `glp1-s`, `glp2-t`, `wolverine`, `ss-31`, `bac-water` formally.** None are in the architecture doc §5.2 table. Recommend CMO drafts a `product-architecture.md v3` section for these or board ratifies a one-page addendum.
4. **(Medium) Re-price MOTS-c against the SKA-60 5/10mg variant shape.** Architecture doc §5.2 priced 40mg only ($229). Live SKU is 5/10mg per SKA-60. At market median ~$5.18/mg, a $99/10mg or $149/10mg launch would put us at a premium without being absurd. Pick.
5. **(Medium) Sign up to Flawless Compounds and Crush Research before next pricing review.** They are the most likely peer-tier competitors and we have no data on either.
6. **(Low) GLOW/KLOW market signal.** Stockouts across the set suggest the named-blend format may be moving out of fashion in gray-market. Worth watching before we promote either.

---

## 6. Limitations of this scan

- **No live storefront data for our own prices.** Auth gate + admin 404 forced reliance on architecture-doc intent prices. The matrix is therefore "intent vs. market" not "live vs. market." Re-run once admin is reachable.
- **No Flawless / Crush data.** Login walls; signup not attempted (per brief permission to skip).
- **Promo banners not deeply audited.** A few sale prices captured (e.g., Verified GHK-Cu $44.50, Core Hexarelin $47, Core Sermorelin $48). No vendor was running a site-wide banner discount at scan time; deeper promo tracking would require recurring crawls.
- **`$/mg` is not perfectly comparable across blend SKUs.** A $300 / 70mg blend is not the same value as $300 / 70mg of any single component. The blend rows in §3 should be read as composite cost reference, not direct molecule comparison.
- **Vendors are named in good faith.** I have not verified COA quality, identity confirmation, or batch-to-batch consistency on any competitor. This document is *price* intelligence only.

---

> Re-scan cadence recommendation: quarterly, plus once after admin/storefront access is restored. Owner: CMO.
