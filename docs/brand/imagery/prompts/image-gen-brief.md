# CaliLean — Image-gen prompt brief v0

**Owner:** Designer
**Tracking:** [SKA-14](/SKA/issues/SKA-14)
**Provider target:** OpenAI gpt-image-1 (board-recommended). Brief is provider-agnostic — usable with DALL-E, Stable Diffusion XL, or Midjourney v6 with minor syntax edits.
**Posture:** RUO. No human models in v0 generated content.
**Status:** v0 — locked structure, not locked copy. Iterate on the surface-specific blocks; never edit the global guard rails.

This brief gives anyone (Designer, CTO, ops) a reproducible way to render a CaliLean image. The structure is **system → surface → SKU/scene → guard rails**. Always include all four blocks.

---

## 0. Why this exists

Image gen drifts. Every render reverts toward "stock medical lab" or "Instagram wellness" unless we hold a tight system prompt. This file is the system prompt. Every prompt that ships goes into [`renders/<date>-<surface>-<sku>.txt`](./) (path TBD when production unblocks).

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

This brief is **v0**. Bump to v0.1 the first time we change any non-bracketed text. Bump to v1 when we lock a real photographer for hero. Bump to v2 when we replace the wordmark text on the label with the outlined custom wordmark from [SKA-13](/SKA/issues/SKA-13).
