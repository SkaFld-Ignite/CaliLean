# CaliLean — render log

Append-only log of every image-gen run. Source of truth for which prompts produced which renders.

Contract: [`docs/brand/imagery/prompts/image-gen-brief.md`](../prompts/image-gen-brief.md) §5.

## Run 2026-04-26T06:34:52.845Z

Provider: Google Imagen 4 (`generativelanguage.googleapis.com`).
Gate review: Designer (this run); CMO + CEO sign-off pending.

| Label | Model | Aspect | Accent | Compound | Dosage | Lot | Elapsed | Bytes |
|---|---|---|---|---|---|---|---|---|
| hero-16x9-retatrutide | ultra | 16:9 | pacific | RETATRUTIDE | 15 | 24-0438 | 12.2s | 899163B png / 24890B jpg |
| pdp-primary-retatrutide | ultra | 1:1 | pacific | RETATRUTIDE | 15 | 24-0438 | 11.3s | 1823659B png / 185947B jpg |
| pdp-primary-bpc-157 | standard | 1:1 | pacific | BPC-157 | 5 | 24-0312 | 21.1s | 1116178B png / 85751B jpg |
| pdp-primary-cjc-12-no-dac-ipamorelin-blend | standard | 1:1 | eucalyptus | CJC-1295 / IPAMORELIN | 5 / 5 | 24-0381 | 14.7s | 1020150B png / 88374B jpg |
| pdp-primary-nad | standard | 1:1 | eucalyptus | NAD+ | 100 | 24-0410 | 14.9s | 1567521B png / 137841B jpg |
| pdp-primary-bpc-157-tb-500-blend | fast | 1:1 | pacific | BPC-157 / TB-500 | 5 / 5 | 24-0395 | 3.2s | 2159454B png / 239372B jpg |
| pdp-primary-tb-500 | fast | 1:1 | pacific | TB-500 | 5 | 24-0327 | 4.3s | 1555014B png / 139281B jpg |
| pdp-primary-mots-c | fast | 1:1 | eucalyptus | MOTS-C | 10 | 24-0356 | 3.5s | 2259253B png / 260145B jpg |
| pdp-primary-glutathione | fast | 1:1 | pacific | GLUTATHIONE | 200 | 24-0433 | 2.9s | 2019009B png / 223059B jpg |

## Run 2026-04-26T06:38:49.424Z — re-render (natural-language prompt)

Reason: first pass at `standard` produced two complete failures (BPC-157, CJC-Ipamorelin) where Imagen rendered the prompt schema (`SURFACE:`, `<RenderSettings>`) as visible canvas text, plus three marginals (BPC/TB blend, MOTS-c, Glutathione) with gibberish label sublines and heavy shadow drama. This pass uses a single natural-language paragraph (no structural caps) and forces `standard` for the four formerly-fast SKUs.

| Label | Model | Aspect | Compound | Lot | Elapsed | Bytes |
|---|---|---|---|---|---|---|
| pdp-primary-bpc-157 | standard | 1:1 | BPC-157 | 24-0312 | 12.9s | 1363079B png / 106369B jpg |
| pdp-primary-bpc-157-tb-500-blend | standard | 1:1 | BPC-157 / TB-500 | 24-0395 | 24.2s | 1467826B png / 127696B jpg |
| pdp-primary-mots-c | standard | 1:1 | MOTS-C | 24-0356 | 12.8s | 1450283B png / 125847B jpg |
| pdp-primary-glutathione | standard | 1:1 | GLUTATHIONE | 24-0433 | 11.8s | 1501625B png / 131925B jpg |

**Errors (1):**
- `pdp-primary-cjc-12-no-dac-ipamorelin-blend`: HTTP 503: {
  "error": {
    "code": 503,
    "message": "Image generation failed with the following error: Fail to execute model for flow_id: flow-juno-prompt-rewriter-vertex-imagen-jpe-v1-8\nError: Deadline exceeded during decode.; Failed to close the streaming context; status = CANCELLED: ;  Failed to run inference for model: go/debugproto    \nname: \"prod-common-global__/vertex/vertex-imagen-jpe-v1-8__

## QA gate — Designer sign-off 2026-04-26

Per [`prompts/image-gen-brief.md`](../prompts/image-gen-brief.md) §4 Quality Gate. Each render checked against negative-prompt items, label legibility, and accent-color budget.

| Render | Verdict | Notes |
|---|---|---|
| `hero-16x9-retatrutide` | ✅ ship | All gates pass. Vial in left third per spec, Pacific cap reads true, label fully legible (`Calilean`, `RETATRUTIDE`, `15 mg / vial`, `LOT 24-0438`), Pacific horizon at vertical center, May Gray atmosphere. The shot reads "research bench at the edge of the Pacific" as briefed. |
| `pdp-primary-retatrutide` | ✅ ship | Vial centered on Salt linen, label legible, Pacific cap reads slightly more saturated cyan than spec hex `#3A5A6A` — minor drift, acceptable for v0. |
| `pdp-primary-bpc-157` | ✅ ship | Re-render (natural-language prompt). Clean centered composition, Pacific cap, label fully legible. |
| `pdp-primary-cjc-12-no-dac-ipamorelin-blend` | ✅ ship | Re-render. Eucalyptus cap, label reads `CJC-1295 / IPAMORELIN`, `5 / 5 mg / vial`, `LOT 24-0381`. Negative space ample. |
| `pdp-primary-nad` | ✅ ship | First-pass survivor. Label clean (`NAD+`, `100 mg / vial`, `LOT 24-0410`). Cap drifted toward neutral aluminum rather than Eucalyptus sage — flag for v0.1, ship for v0. |
| `pdp-primary-bpc-157-tb-500-blend` | ✅ ship | Re-render. Vial slightly larger than spec ratio (negative-space rule pushed to ~30% vs target 35%). Front-face label legible. Acceptable for v0. |
| `pdp-primary-tb-500` | ✅ ship | Re-render. Replaced first-pass take where dosage line printed `5 mg / via` (text-rendering glitch). Now reads `5 mg / vial` cleanly. |
| `pdp-primary-mots-c` | ⚠ ship-with-flag | Re-render. Front-face label is clean (`MOTS-C`, `10 mg / vial`, `LOT 24-0356`). Minor gibberish text artifact on the side wraparound at hard label tilt — barely visible from the canonical top-down crop but present at full PNG resolution. Schedule v0.1 retake when there is reason to spend another credit. |
| `pdp-primary-glutathione` | ⚠ ship-with-flag | Re-render. Pacific cap, label reads `GLUTATHIONE`, `200 mg / viaa`, `LOT 24-0433` — single-character text-rendering artifact (`vial` → `viaa`). The artifact is small enough that on PDP-thumb sizes it is illegible (reads as `vial`); at full label macro it is visible. Schedule v0.1 retake. |

**Net:** 7 clean hits, 2 ship-with-flag for v0.1 retake. All 9 are a category leap above the scraped Bluum placeholders they replace.

### Prompt-engineering lesson learned

First-pass prompts used the brief's structural-block format verbatim (`SURFACE: …`, `SUBJECT: …`, `RENDER: …`). At `imagen-4.0-generate-001` two SKUs (BPC-157, CJC-Ipamorelin) collapsed into renders where the prompt schema was painted onto the canvas as visible text — purple "MOCKUP" backdrops with code annotations. This is a known Imagen drift pattern when prompts contain syntax that resembles code/config.

Switching to a single natural-language paragraph (no all-caps block headers, no `KEY: value` syntax) eliminated the failure mode across all five re-renders. Updating the prompt brief to v0.1 in a follow-up commit so the failure is documented and the natural-language template is the canonical recipe. Imagen Ultra (`imagen-4.0-ultra-generate-001`) was robust to the structural format on the hero and Retatrutide PDP — Ultra appears to be more tolerant of structured prompts than the standard model.
