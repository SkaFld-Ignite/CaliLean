# CaliLean — Image-gen prompt brief v0

**Owner:** Designer
**Tracking:** [SKA-14](/SKA/issues/SKA-14)
**Provider:** Google Imagen 4 via `generativelanguage.googleapis.com` (`imagen-4.0-fast-generate-001` / `imagen-4.0-generate-001` / `imagen-4.0-ultra-generate-001`). API key at `_default/.env.secrets` as `GOOGLE_API_KEY` (board landed 2026-04-26). Brief is mostly provider-agnostic — Imagen-specific notes are flagged inline.
**Posture:** RUO. No human models in v0 generated content.
**Status:** v0.1 — bumped from v0 after the first launch batch revealed an Imagen failure mode where structural prompts (`SURFACE:`, `SUBJECT:`, `<RenderSettings>`) get rendered as visible canvas text. v0.1 keeps §1–§4 as the *system contract* and adds §1.5 — a natural-language template that is the actual recipe to send to Imagen at the standard tier. The structural blocks remain useful for documentation and for Ultra-tier renders where they survive intact.

This brief gives anyone (Designer, CTO, ops) a reproducible way to render a CaliLean image. The structure is **system → surface → SKU/scene → guard rails**. Always include all four blocks.

---

## 0. Why this exists

Image gen drifts. Every render reverts toward "stock medical lab" or "Instagram wellness" unless we hold a tight system prompt. This file is the system prompt. Every prompt that ships goes into [`renders/<date>-<surface>-<sku>.txt`](./) (path TBD when production unblocks).

---

## 1.5. Natural-language template (Imagen 4 standard — what to actually send)

**Use this template, not the block-by-block §1–§4 concat, when calling `imagen-4.0-generate-001` or `imagen-4.0-fast-generate-001`.** A single paragraph, no all-caps section headers, no `KEY: value` syntax. Substitute the bracketed placeholders.

```
An overhead photograph of a single small clear glass research vial (about
two milliliters), photographed straight down from directly above, resting on
a heavyweight off-white linen-cotton textile in a warm Salt off-white tone
hex F4F2EC. The vial has an aluminum crimp seal cap colored [muted Pacific
blue hex 3A5A6A (deep teal-blue) | muted Eucalyptus sage hex 7C8A78 (soft
sage green)], with a slight matte finish, no logo on the cap. Inside the
vial is a pale beige lyophilized cake, dry, slightly translucent at the
edges. A clean wraparound paper label in the same Salt off-white wraps the
lower two-thirds of the vial. The label is printed in dark Iron near-black
ink. The wordmark "calilean" is set small in lower-case at the very top of
the label, with a thin hairline rule beneath it. Below that, the compound
name is set in a low-contrast modern serif at large size and reads exactly:
[COMPOUND]. Below the compound name, a thin hairline rule, then the dosage
line printed in monospace reads "[DOSAGE] mg / vial". Below the dosage
line, set in monospace, the lot designation reads exactly: LOT [YY-####].
Composition: the vial is centered in the square frame with at least 35%
empty Salt-toned linen visible around it. No other props, no decoration,
no other objects in the frame. Lighting: cool diffuse daylight from a
north-facing window, color temperature about 5400 Kelvin, very soft and
even, no harsh shadows, no directional spotlight, no glare on the glass,
no flash, low contrast. Style: restrained editorial product photography
in the style of an Aesop apothecary catalog crossed with a research bench,
premium clinical, document-forward, sharp focus across the entire vial,
the label perfectly legible, no motion blur, no bokeh on the subject, no
lens flare, no HDR look. Strictly do not include: any other text or codes
anywhere in the frame beyond the label content described, no people, no
hands, no fingers, no faces, no white lab coats, no blue gloves, no
beakers, no test tubes, no syringes, no needles, no green or red or blue
liquid, no gradient backdrops, no marble, no wood grain, no sand, no gym
equipment, no watermark, no instagram orange grading, no neon, no
decorative borders, no mockup labels or annotations, no source code, no
UI panels, no schema text.
```

**Why this works and the §1–§4 concat doesn't:** Imagen treats `KEY: value` blocks and `<XmlLikeTags>` as text content to render onto the canvas, not as instructions. The natural-language paragraph encodes the same constraints in prose form, which the model ingests as semantic guidance. Failure mode for the structural format: see [`renders/log.md`](../renders/log.md) — first BPC-157 and CJC-Ipamorelin renders rendered the prompt schema as visible "MOCKUP" code blocks on a purple backdrop.

**Imagen Ultra exception:** `imagen-4.0-ultra-generate-001` survives the structural format intact (Ultra has a stronger prompt rewriter). Either format is fine for Ultra. For the hero render and Retatrutide PDP we used the structural format successfully on Ultra.

**Imagen API parameters used:** `aspectRatio` (`1:1` for PDP, `16:9` for hero), `personGeneration: dont_allow`, `sampleCount: 1`. Optional `seed` for reproducibility (not used in v0 because we wanted variation).

---

## 1. Global system block (paste verbatim into every prompt)

```
You are rendering a product image for CaliLean, a research-use-only (RUO)
peptide brand. Aesthetic: Aesop apothecary meets a research bench in coastal
California. Restrained, premium-clinical, document-forward. Never lifestyle,
never wellness influencer, never bodybuilder. Never the generic stock
medical lab look (no white coats, no blue gloves, no green-liquid beakers).
Color palette is dominated by Salt #F4F2EC (warm off-white) and Iron #1F2326
(near-black, cool undertone). Single accent allowed per frame: Pacific
#3A5A6A or Eucalyptus #7C8A78. Coral #D9624A only as a small RUO sticker.
Light: cool diffuse daylight, 5400K, no direct sun, no flash, no shadow
drama, low contrast. Composition: generous negative space, one subject,
one accent, no decoration. Type-on-image: only what the brand specifies
(wordmark, lot mono, COA chip). No invented logos, no extra text.
```

**Non-negotiables (repeat in every prompt):**

```
DO NOT include: hands, people, white lab coats, blue nitrile gloves, beakers,
green/red/blue liquid, gradients, gold foil, neon, hexagon icons, DNA helix,
leaves, droplets, marble surfaces, wood grain, sand, gym mats, motion blur,
bokeh, lens flare, HDR look, instagram orange grading, AI-watermark text.
```

---

## 2. Surface blocks

Pick exactly one and paste. Edit the bracketed `[…]` placeholders only.

### 2A. PDP primary (1:1, 2000 × 2000)

```
SURFACE: PDP primary, square, top-down camera at 90 degrees.
SUBJECT: a single 2ml clear glass vial with a [Pacific blue / Eucalyptus
sage] aluminum crimp cap, lyophilized pale-beige cake inside, wraparound
Salt-stock label printed in Iron type reading "calilean" with the compound
"[COMPOUND NAME]" set in a low-contrast modern serif, a "[DOSAGE] mg / vial"
line in monospace below, and a small "LOT [LOT-NUMBER]" line in monospace.
GROUND: heavyweight Salt-tone linen-cotton blend, slight texture.
COMPOSITION: vial dead-center, no other props, at least 35% Salt-tone
negative space outside the vial.
LIGHT: cool diffuse north-window daylight, soft top-light, no shadow drama.
RENDER: photoreal, sharp focus across the entire vial, label perfectly
legible, ISO 100 look.
```

### 2B. PDP gallery — macro label (1:1, 2000 × 2000)

```
SURFACE: PDP gallery slot 2, square, 4× crop into the wraparound label of
the vial. Label fills 80% of frame.
SUBJECT: extreme macro of the wraparound label printed on Salt-tone stock,
Iron type, hairline rules above and below. The compound name "[COMPOUND]"
in a low-contrast modern serif at large size; "[DOSAGE] mg / vial" and
"LOT [LOT-NUMBER]" in monospace below.
GROUND: barely visible Salt linen at edges only.
LIGHT: same diffuse daylight, slight grazing angle to reveal paper texture
without losing legibility.
RENDER: photoreal, depth of field essentially infinite (focus across whole
label), clean print quality, no print imperfections, no smudges.
```

### 2C. PDP gallery — scale reference (1:1, 2000 × 2000)

```
SURFACE: PDP gallery slot 3, square, top-down camera at 90 degrees.
SUBJECT: the same vial as PDP primary, accompanied by a single US quarter
coin (date face up, real proportions) at lower-right, exactly 24mm in
diameter relative to the vial's 22mm body diameter for true scale.
GROUND: brushed 304 stainless steel, very fine grit, cool tone.
COMPOSITION: vial slightly above center, quarter at lower-right third,
nothing else. 35%+ negative space.
LIGHT: cool diffuse, slight reflection on stainless without glare.
RENDER: photoreal, sharp, true-scale, no artistic flourish.
```

### 2D. PDP context — bench still life (4:5, 1600 × 2000)

```
SURFACE: PDP context, vertical 4:5, three-quarter perspective camera at
+25 degrees elevation.
SUBJECT: the same vial standing upright on a brushed stainless surface,
with one inert prop chosen from: a closed adjustable micropipette in
matte cool-grey plastic; or a single folded printed COA page in Salt
stock with Iron type; or a small batch tag tied with thin natural twine.
COMPOSITION: vial off-center to left third, prop to right third, generous
negative space above. Never both props.
LIGHT: north-window daylight from camera-left, no kicker.
RENDER: photoreal, slight depth of field on the far prop only, vial in
sharp focus, no bokeh on the vial itself.
```

### 2E. Editorial — document still life (3:2, 2700 × 1800)

```
SURFACE: editorial, horizontal 3:2, 30-degree perspective.
SUBJECT: a printed protocol page on Salt stock with Iron-printed body type
and a monospace lot block, partially overlapped by the vial standing on
its label. A single matte-black cartridge pen rests at a 25-degree angle
across the lower-left corner.
GROUND: Salt linen.
COMPOSITION: page covers the right two-thirds, vial centered on page,
pen lower-left, generous negative space around the page edges.
LIGHT: cool diffuse, gentle window-light shadow falling rightward.
RENDER: photoreal, document-forward, type fully legible, no decorative
flourish, no hands.
```

### 2F. Hero — coastal abstract (16:9, 3200 × 1800)  *(use only as fallback if photographer not yet hired)*

```
SURFACE: hero, horizontal 16:9, eye-level camera.
SUBJECT: a single CaliLean vial in foreground sharp focus, on a white
ceramic-tile surface with a 4mm grout line running horizontally beneath
it. Background: blurred horizon line of overcast Pacific sky meeting flat
calm ocean, no surf, no sun, no human, no birds. May Gray atmosphere.
COMPOSITION: vial in left third, horizon at vertical center, vast negative
space across right two-thirds.
LIGHT: very cool, very low contrast, even gray sky.
RENDER: photoreal, editorial, restrained. The frame should read "research
bench positioned at the edge of the Pacific," not "beach photo with a vial
in it." If the result feels like a vacation photo, it has failed; rerender.
```

---

## 3. SKU/scene block (parametric — fill per render)

Per-render variables. Keep this block tight; long SKU descriptions confuse the model.

```
COMPOUND: [BPC-157 | TB-500 | NAD+ | GHK-Cu | ...] (one of the 33 seeded
            compounds — see scripts/seed-products.py)
DOSAGE:   [5 / 10 / 100] mg per vial
LOT:      [24-0438] (use a plausible lot pattern: YY-####)
ACCENT:   [Pacific #3A5A6A | Eucalyptus #7C8A78]
            (lock per product family — Pacific = recovery/repair; Eucalyptus
             = longevity/cosmetic)
```

---

## 4. Guard rails (paste verbatim, every render)

```
NEGATIVE PROMPT: people, hands, fingers, faces, lab coats, blue gloves,
beakers, test tubes, syringes (unless explicitly listed in SUBJECT),
needles, gold foil, gradient backdrops, marble, wood, sand, gym equipment,
bokeh on subject, motion blur, lens flare, HDR, instagram filter, orange
grading, neon, watermark, generated text other than the specified label.

QUALITY GATE: if the render contains any item from the negative prompt,
discard and rerender. If the vial label is illegible or invents text,
discard and rerender. If the accent color appears more than once in the
frame, discard and rerender.
```

---

## 5. Render-and-review workflow

1. Concatenate Block 1 + 2x + 3 + 4 into a single prompt body.
2. Generate 4 candidates per prompt at native resolution.
3. Designer reviews against the Quality Gate (block 4) and the system spec §3, §5, §6, §7. **Designer signs off in [`renders/log.md`](./) before any render goes to MinIO.**
4. CTO uploads approved renders to MinIO at the path defined by the bucket-naming ticket (cut from this issue).
5. Caption + alt text written by CMO using brief §3 voice.

---

## 6. Versioning

This brief is **v0.1**. v0 → v0.1 added §1.5 natural-language template after the first launch batch revealed Imagen's prompt-leak failure mode at the standard tier (board moved hero to AI per [SKA-1](/SKA/issues/SKA-1) cascade, so the photographer-vs-AI fork in v0 collapsed). Bump to v1 when the wordmark text on the label is replaced with the outlined custom wordmark from [SKA-13](/SKA/issues/SKA-13). Bump to v2 when we add packaging-mockup compositing for SKUs that ship in cartons.
