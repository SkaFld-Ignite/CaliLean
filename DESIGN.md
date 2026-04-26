# DESIGN.md — CaliLean Design Tokens (v0)

> Version: v0 · Date: 2026-04-26 · Owner: Designer (drafted by CTO during SKA-17 implementation while Designer's master assets were unsynced; reconcile on next merge)
> Source of truth for tokens consumed by `storefront/tailwind.config.js` + `storefront/src/styles/calilean-tokens.css`.
> Companion: `docs/brand/identity-brief.md` (locked v1.1 RUO) and `docs/brand/wordmark-brief.md`.

---

## 1. Palette A — Salt & Iron (locked)

| Token | Hex | Tailwind | CSS var | Role |
|---|---|---|---|---|
| salt | `#F4F2EC` | `calilean.bg` | `--cl-bg` | Page background. Warm off-white. |
| iron | `#1F2326` | `calilean.ink` | `--cl-ink` | Body text, wordmark. Near-black, blue undertone. |
| pacific | `#3A5A6A` | `calilean.pacific` | `--cl-pacific` | Primary accent. CTAs, links. |
| fog | `#9CA3A8` | `calilean.fog` | `--cl-fog` | Muted text, dividers. |
| sand | `#E6E2D6` | `calilean.sand` | `--cl-sand` | Surface variant. Cards. |
| coa | `#0F1417` | `calilean.coa` | `--cl-coa` | Lab black. COA / batch / data UI. |
| alert | `#A23B2A` | `calilean.alert` | `--cl-alert` | RUO disclaimer accent. Restraint. |

Aliases (legacy semantic compat for existing storefront classes):

- `eucalyptus` → alias for `pacific` (do not introduce a new green; deferred to Palette C).
- `coral` → alias for `alert`.

## 2. Type — Pairing 1 (Editorial + Precision)

| Role | Family (production fallback) | Procurement target | next/font key |
|---|---|---|---|
| Display | **Fraunces** (SIL OFL, variable) | GT Sectra Display | `Fraunces` |
| Body / sans | **Inter** (SIL OFL, variable) | Söhne | `Inter` |
| Mono / data | **JetBrains Mono** (Apache 2.0, variable) | Söhne Mono | `JetBrains_Mono` |

Loading: `next/font/google` with `display: 'swap'`. CSS variables: `--font-display`, `--font-sans`, `--font-mono`. Tailwind families read these vars.

**Forbidden:** Switzer (legacy Bluum). Avenir/Proxima/Gotham. Circular/Visby. Any humanist-rounded sans.

## 3. Wordmark tracking (custom properties)

Three CSS custom properties for wordmark letter-spacing across surfaces. Defined on `:root`; consumed by `<CaliLeanLogo>` via inline style.

| Property | Value | Where it applies |
|---|---|---|
| `--brand-wordmark-tracking-nav` | `0.02em` | Header / nav. Tighter for visual density. |
| `--brand-wordmark-tracking-display` | `0.03em` | Hero / display sizes. Matches +30 baked into master SVG. |
| `--brand-wordmark-tracking-packaging` | `0.06em` | Packaging / OG cards / large-format. Wider for photographic backgrounds. |

## 4. Logo masters

All under `docs/brand/logo/master/`:

- `wordmark.svg` — `<text>`-based, currentColor, Fraunces fallback chain. v0.1 will replace with foundry-outlined Bezier glyphs (no storefront wiring change).
- `favicon-c.svg` — lowercase `c`, tuned for 16px. Background: `--cl-bg`. Glyph: `--cl-coa`.
- `safari-pinned-tab-mask.svg` — single-color silhouette per Apple spec.
- `fingerprint-glyph-a.svg` — *(pending Designer; v0.1 customization for the `a` glyph in wordmark).*

## 5. Surfaces — minimum sizes

| Surface | Min wordmark height | Falls back to |
|---|---|---|
| Nav (desktop) | 28px | — |
| Nav (mobile) | 24px | — |
| Footer | 28px | — |
| Email header | 32px | — |
| OG card | 96px | — |
| < 16px | — | `favicon-c.svg` only |

## 6. Open items

1. Designer to ratify wordmark.svg / favicon-c.svg / safari-mask master after their workspace syncs to shared `master`. CTO's v0 implementations match published spec; replace in place if Designer deltas exist.
2. Custom `a` fingerprint glyph (`fingerprint-glyph-a.svg`) — not shipped in CTO's v0; lands when Designer pushes.
3. GT Sectra Display + Söhne procurement (CEO + budget). Until then, Fraunces + Inter render production.

---

## Changelog

- **v0 (2026-04-26)** — Initial DESIGN.md committed by CTO during [SKA-17](/SKA/issues/SKA-17). Built from Designer's published spec on [SKA-13](/SKA/issues/SKA-13) because Designer's master commits had not synced into the CTO workspace at swap time. Designer to overwrite or annotate as needed.
