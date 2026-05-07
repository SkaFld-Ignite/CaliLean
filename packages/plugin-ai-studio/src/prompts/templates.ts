import { ViewType } from "../lib/types"

export const VIEW_TEMPLATES: Record<ViewType, string> = {
  A_vial_front: `A premium product photograph of a single small clear glass research vial
(about two milliliters) standing upright, photographed at a slight
three-quarter angle (about 15 degrees from straight-on) so the front
label is fully visible. Behind and slightly to the right of the vial
stands a matte steel-blue rectangular box (approximately hex {BOX_HEX})
with a large semi-transparent white "CL" monogram on the front face
and "CaliLean" in small white sans-serif at the bottom of the box.

The vial has an aluminum crimp-seal cap colored {CAP_COLOR_NAME}
(hex {CAP_HEX}) with a silver aluminum crimp ring beneath it. Inside
the vial is a {FORM_INSIDE}.

The wraparound label on the vial is printed on off-white stock (hex
F4F2EC) with the following layout reading top to bottom:

Left side of label:
- "CaliLean" in small sans-serif (Plus Jakarta Sans style), near-black
- A thin hairline rule
- "{COMPOUND}" in large bold sans-serif, near-black — this is the
  largest text on the label, the hero element
- "{DOSAGE}" in medium monospace, muted gray (hex 8B9298)
- Another thin hairline rule
- "Lot {LOT} · >99% · 2-8°C" in tiny monospace, muted gray
- "calilean.com/coa" in tiny monospace, muted gray

Right side of label:
- A bold horizontal double-line mark (══) colored {ACCENT_COLOR_NAME}
  (hex {ACCENT_HEX})
- Below that, a small square QR code also in {ACCENT_COLOR_NAME}
  (hex {ACCENT_HEX})
- At the very bottom right in tiny text: "For research use only."
  and below that "Not for human use."

Background: clean white studio surface, very soft shadow beneath vial.
No other objects. Generous negative space. Sharp focus across vial and
box. Label must be perfectly legible.

CRITICAL COLOR CONSTRAINTS:
1. The BOX must be strictly steel-blue (#6B8399).
2. The VIAL CAP must be {CAP_COLOR_NAME} (hex {CAP_HEX}).
3. DO NOT tint the box to match the cap. DO NOT apply {CAP_HEX} to the box. The color {CAP_HEX} is STRICTLY isolated to the small plastic cap.
4. The label background must remain pure off-white. DO NOT tint the label.`,

  B_vial_back: `A premium product photograph of the same CaliLean research vial as
Prompt A, but rotated approximately 180 degrees so the back/side of
the wraparound label is visible. The QR code (colored {ACCENT_HEX})
and the "For research use only. Not for human use." text should be
prominently visible in this view. The lot number line and
"calilean.com/coa" URL should also be readable. The {CAP_COLOR_NAME}
aluminum cap (hex {CAP_HEX}) is visible at the top. The steel-blue
box is visible in the background, slightly out of focus, showing the
product side panel with compound name and dosage in white text.

Same lighting, same background, same style as Prompt A. Label text
must be legible. Sharp focus on the vial.

CRITICAL COLOR CONSTRAINTS:
1. The BOX must be strictly steel-blue (#6B8399).
2. The VIAL CAP must be {CAP_COLOR_NAME} (hex {CAP_HEX}).
3. DO NOT tint the box to match the cap. DO NOT apply {CAP_HEX} to the box. The color {CAP_HEX} is STRICTLY isolated to the small plastic cap.
4. The label background must remain pure off-white. DO NOT tint the label.`,

  C_flat_label: `A perfectly flat, horizontal, top-down photograph of a printed product
label laid flat on a clean white surface. The label is rectangular,
approximately three times as wide as it is tall (a wraparound vial
label unrolled flat). The label stock is off-white (hex F4F2EC) with
a very subtle paper texture.

The label is divided into two zones:

LEFT ZONE (approximately 65% of width):
- Top-left: "CaliLean" in small bold sans-serif, near-black (hex 1F2326)
- Below: a thin hairline rule spanning the left zone
- Center-left, large: "{COMPOUND}" in bold sans-serif, near-black —
  this is the dominant text element on the entire label
- Below compound name: "{DOSAGE}" in monospace, muted gray (hex 8B9298)
- Below: another thin hairline rule
- Bottom-left: "Lot {LOT} · >99% · 2-8°C" in tiny monospace, muted gray
- Below: "calilean.com/coa" in tiny monospace, muted gray

RIGHT ZONE (approximately 35% of width):
- Top-right: a bold horizontal double-line mark (══) colored
  {ACCENT_COLOR_NAME} (hex {ACCENT_HEX}), centered in the right zone
- Center-right: a QR code square, also in {ACCENT_COLOR_NAME}
  (hex {ACCENT_HEX}), approximately 8mm rendered size
- Bottom-right: "For research use only." in tiny sans-serif, near-black,
  and below that "Not for human use." in the same tiny text

The entire label has clean edges, no bleed marks visible, no crop marks.
It looks like a final proof ready for print production. Perfectly sharp,
perfectly flat, no perspective distortion, no shadow, no curl. Overhead
camera, 90 degrees straight down. White background around the label.

CRITICAL COLOR CONSTRAINTS:
1. The BOX (if visible) must be strictly steel-blue (#6B8399).
2. The VIAL CAP (if visible) must be {CAP_COLOR_NAME} (hex {CAP_HEX}).
3. DO NOT tint the box to match the cap. DO NOT apply {CAP_HEX} to the box. The color {CAP_HEX} is STRICTLY isolated to the small plastic cap.
4. The label background must remain pure off-white. DO NOT tint the label.`,

  D_box_assembled: `A premium product photograph of a matte steel-blue rectangular box
(approximately hex {BOX_HEX}) standing upright, photographed at a
three-quarter angle so both the front face and one side panel are
visible. No vial in this shot — box only.

FRONT FACE: A large semi-transparent white "CL" monogram occupies the
upper two-thirds of the face. "CaliLean" is printed in small white
sans-serif text near the bottom.

VISIBLE SIDE PANEL (product info side): White text reading from top
to bottom:
- "{COMPOUND}" in bold sans-serif
- "{DOSAGE}" in monospace
- "{FORM_TEXT}" in small sans-serif
- ">99% Pure" in small monospace
- "2-8°C" in small monospace
- A small QR code in {ACCENT_COLOR_NAME} (hex {ACCENT_HEX})
- "For research use only. Not for human or animal use." in tiny text
- "calilean.com" in tiny monospace

TOP FACE (partially visible at angle): "CaliLean" wordmark and a
small ══ mark in {ACCENT_COLOR_NAME} (hex {ACCENT_HEX}).

Background: clean white surface, very soft shadow. No other objects.
Premium pharmaceutical packaging photography. Sharp focus.

CRITICAL COLOR CONSTRAINTS:
1. The BOX must be strictly steel-blue (#6B8399).
2. DO NOT apply {CAP_HEX} to the box.`,

  E_box_dieline: `A clean top-down technical photograph showing the complete packaging
components for a CaliLean research product, laid out flat on a clean
white surface in an organized grid arrangement. This is a manufacturing
reference image showing every component separated.

Components laid out left to right:

1. BOX DIELINE (unfolded flat): The matte steel-blue box (hex {BOX_HEX})
   completely unfolded showing all six faces in a cross-shaped dieline
   pattern. White printing visible on each face:
   - Front: large CL monogram + "CaliLean" wordmark
   - Back: lot number field, barcode placeholder, legal text
   - Side A: "{COMPOUND}", "{DOSAGE}", specs, QR code in
     {ACCENT_COLOR_NAME}, RUO disclaimer
   - Side B: compound name and dosage (rotated), RUO text
   - Top: "CaliLean" + ══ mark in {ACCENT_COLOR_NAME}
   - Bottom: UPC barcode area

2. FLAT LABEL: The wraparound vial label laid flat, showing the
   complete label artwork as described in Prompt C.

3. VIAL (empty): A clear 2mL glass vial, empty, no cap, no label.

4. CAP + CRIMP: An aluminum crimp cap in {CAP_COLOR_NAME}
   (hex {CAP_HEX}) with a silver aluminum crimp ring, shown
   from above.

All components arranged in a neat horizontal row with equal spacing.
Overhead camera, 90 degrees straight down. Clean white background.
No shadows except very subtle contact shadows. Sharp focus on all
components. Technical/manufacturing reference style — precise, clean,
no artistic flourish.

CRITICAL COLOR CONSTRAINTS:
1. The BOX DIELINE must be strictly steel-blue (#6B8399).
2. The VIAL CAP must be {CAP_COLOR_NAME} (hex {CAP_HEX}).
3. DO NOT tint the box to match the cap. DO NOT apply {CAP_HEX} to the box. The color {CAP_HEX} is STRICTLY isolated to the small plastic cap.`,
}
