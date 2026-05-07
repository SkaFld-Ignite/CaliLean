# NB2 AI Studio — Design Spec

**Date:** 2026-05-07
**Status:** Approved
**Author:** Charles Sims + Claude

## Overview

Upgrade `@calilean/plugin-ai-studio` from a single-prompt Imagen wrapper to a full Nano Banana 2 (NB2) product photography pipeline. Two modes: Quick Shot (single image, free-form prompt) and Product Shoot (batch generate all 5 canonical views for a product). Uses Gemini `gemini-3.1-flash-image-preview` and `gemini-3-pro-image-preview` models. Generated images upload directly to MinIO and attach to products.

## Goals

1. **Product photography at scale** — generate publication-ready product images for all 15 products × 30 variants from the admin dashboard
2. **Brand consistency** — enforce CaliLean's visual identity through prompt templates, color constraints, and reference image injection
3. **Operational simplicity** — one-click "Product Shoot" generates all 5 views, uploads to MinIO, attaches to product

## Models

- **`gemini-3.1-flash-image-preview`** — fast generation, default for batch shoots
- **`gemini-3-pro-image-preview`** — higher quality, available for quick shots and regeneration

Both are called via the Gemini REST API at `generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent`. Authenticated with `GOOGLE_API_KEY` (already in the plugin's env config).

## Architecture

```
Admin Dashboard (React)
  → Tab 1: Quick Shot
    → POST /admin/ai-studio/generate
  → Tab 2: Product Shoot
    → POST /admin/ai-studio/shoot
    → POST /admin/ai-studio/shoot/:view (regenerate)
  
  → AiStudioService
    → Fetch product data from Medusa (title, SKU, metadata)
    → Fetch reference images from MinIO (per-product or defaults)
    → Build prompt: NB2 preamble + system block + template + guard rails
    → Call Gemini API with prompt + reference image
    → Upload result to MinIO (medusa-media/products/{handle}/)
    → Attach image URL to product via Medusa product module
    → Return image URL + NB2 self-report
```

## Canonical Views (5-Shot System)

| View | Filename | Description |
|------|----------|-------------|
| A | `A_vial_front.jpg` | Three-quarter angle: vial foreground + box behind |
| B | `B_vial_back.jpg` | 180° rotation showing back label, QR code, RUO text |
| C | `C_flat_label.jpg` | Overhead flat-lay of unrolled label |
| D | `D_box_assembled.jpg` | Box-only three-quarter shot, front face + side panel |
| E | `E_box_dieline.jpg` | Top-down technical flat-lay of all packaging components |

## Product Color Configuration

Stored as Medusa product metadata (`nb2_*` fields):

```json
{
  "nb2_cap_color": "#C25B3F",
  "nb2_cap_color_name": "Rust",
  "nb2_accent_color": "#C25B3F",
  "nb2_accent_color_name": "Rust",
  "nb2_box_color": "#6B8399",
  "nb2_form_inside": "clear liquid with faint yellow tint",
  "nb2_form_text": "Lyophilized Powder"
}
```

Products without `nb2_*` metadata use defaults:
- Box: `#6B8399` (steel-blue)
- Cap/accent: `#8B9298` (muted gray)
- Form: "clear liquid" / "Lyophilized Powder"

Color config is editable inline in the Product Shoot tab before generating.

## Reference Images

Stored in MinIO at `medusa-media/references/`.

**Resolution order:**
1. Per-product: `references/{handle}/A_vial_front.jpg` through `E_box_dieline.jpg`
2. Default: `references/default/A_vial_front.jpg` through `E_box_dieline.jpg`

Default references are the CL-3R original photography from `calilean-assets/`, uploaded once during initial setup.

Admin can upload custom reference images per product via the Product Shoot tab.

## Prompt System

Every generation wraps the prompt in 4 layers:

### 1. NB2 Preamble
```
RENDER PIPELINE: This is a Nano Banana 2 (Gemini 3.1 Flash Image) generation.
Use deep reasoning to plan composition, spatial layout, and material rendering
before generating pixels.

COLOR FIDELITY: Maintain accurate neutral white balance and color-accurate
product rendering suitable for commercial advertising.

CAMERA SIMULATION: Render as if shot on a medium-format digital camera
(Phase One IQ4 150MP equivalent) with precise optics.

SELF-REPORT: After generating the image, describe what you rendered...
```

### 2. System Block
```
You are rendering packaging for CaliLean, a research-use-only peptide brand
based in coastal California. Aesthetic: Aesop apothecary meets pharmaceutical
research bench. [Typography, materials, lighting rules...]
```

### 3. View Template (A–E)
Per-view prompt with variable substitution:
- `{COMPOUND}` — from product.title
- `{DOSAGE}` — from variant.title
- `{LOT}` — from variant.sku
- `{CAP_COLOR_NAME}`, `{CAP_HEX}` — from product.metadata
- `{ACCENT_COLOR_NAME}`, `{ACCENT_HEX}` — from product.metadata
- `{BOX_HEX}` — from product.metadata (default `#6B8399`)
- `{FORM_INSIDE}`, `{FORM_TEXT}` — from product.metadata

### 4. Guard Rails
```
DO NOT include: hands, people, lab coats, blue gloves, beakers, test tubes,
syringes, needles, gradient backdrops, marble, wood grain, sand, gym equipment,
bokeh on subject, motion blur, lens flare, HDR look, instagram filter, neon,
watermark, generated text beyond specified label content...
```

### 5. Color Constraints (per-view)
```
CRITICAL COLOR CONSTRAINTS:
1. The BOX must be strictly steel-blue (#6B8399).
2. The VIAL CAP must be {CAP_COLOR_NAME} (hex {CAP_HEX}).
3. DO NOT tint the box to match the cap.
4. The label background must remain pure off-white.
```

**Quick Shot mode**: user's free-form prompt gets NB2 preamble + guard rails appended, but no view template or color constraints.

## Prompt Template Variables

```typescript
type PromptVariables = {
  COMPOUND: string        // product.title
  DOSAGE: string          // variant.title
  LOT: string             // variant.sku
  CAP_COLOR_NAME: string  // product.metadata.nb2_cap_color_name
  CAP_HEX: string         // product.metadata.nb2_cap_color
  ACCENT_COLOR_NAME: string // product.metadata.nb2_accent_color_name
  ACCENT_HEX: string      // product.metadata.nb2_accent_color
  BOX_HEX: string         // product.metadata.nb2_box_color || "#6B8399"
  FORM_INSIDE: string     // product.metadata.nb2_form_inside
  FORM_TEXT: string        // product.metadata.nb2_form_text
}

type ViewType = "A_vial_front" | "B_vial_back" | "C_flat_label" | "D_box_assembled" | "E_box_dieline"
```

## API Endpoints

### POST /admin/ai-studio/generate (Quick Shot)

Request:
```json
{
  "prompt": "A single CaliLean vial on white background...",
  "model": "flash",
  "aspectRatio": "1:1",
  "referenceImage": "<base64 optional>"
}
```

Response:
```json
{
  "image": { "url": "https://bucket.../generated/quick-shot-1234.jpg", "mimeType": "image/jpeg" },
  "selfReport": "Rendered a clear glass vial with..."
}
```

### POST /admin/ai-studio/shoot (Product Shoot)

Request:
```json
{
  "productId": "prod_01KKVY3H63QW...",
  "variantId": "variant_01KK...",
  "model": "flash",
  "views": ["A_vial_front", "B_vial_back", "C_flat_label", "D_box_assembled", "E_box_dieline"]
}
```

Response:
```json
{
  "results": [
    {
      "view": "A_vial_front",
      "url": "https://bucket.../products/bpc-157/A_vial_front.jpg",
      "selfReport": "Rendered vial with Rust cap (#C25B3F)...",
      "attached": true
    },
    ...
  ]
}
```

### POST /admin/ai-studio/shoot/:view (Regenerate Single View)

Request:
```json
{
  "productId": "prod_01KKVY3H63QW...",
  "variantId": "variant_01KK...",
  "model": "pro"
}
```

Response: same shape as a single entry from the shoot response.

### GET /admin/ai-studio/references/:handle

Response:
```json
{
  "references": {
    "A_vial_front": "https://bucket.../references/bpc-157/A_vial_front.jpg",
    "B_vial_back": null,
    "C_flat_label": null,
    "D_box_assembled": null,
    "E_box_dieline": null
  },
  "defaults": {
    "A_vial_front": "https://bucket.../references/default/A_vial_front.jpg",
    ...
  }
}
```

### POST /admin/ai-studio/references/:handle

Multipart form upload. Sets a custom reference image for a specific view.

## AiStudioService

```typescript
class AiStudioService {
  // Quick Shot
  async generateImage(args: {
    prompt: string
    model?: "flash" | "pro"
    aspectRatio?: string
    referenceImage?: Buffer
  }): Promise<{ image: Buffer; mimeType: string; url: string; selfReport?: string }>

  // Product Shoot (batch 5 views)
  async shootProduct(args: {
    productId: string
    variantId: string
    views?: ViewType[]
    model?: "flash" | "pro"
  }): Promise<Array<{ view: ViewType; url: string; selfReport: string }>>

  // Reference image management
  async getReferences(handle: string): Promise<Record<ViewType, string | null>>
  async uploadReference(handle: string, view: ViewType, image: Buffer): Promise<string>

  // Internal
  private buildPrompt(view: ViewType, vars: PromptVariables): string
  private callGemini(prompt: string, referenceImage?: Buffer, model?: string): Promise<GeminiResult>
  private uploadToMinio(key: string, image: Buffer): Promise<string>
  private attachToProduct(productId: string, imageUrl: string): Promise<void>
}
```

## Admin Dashboard UI

### Tab 1: Quick Shot
- Text prompt textarea
- Model selector: Flash (fast) / Pro (quality)
- Optional reference image drag-and-drop
- Aspect ratio selector
- Generate button
- Result: image preview + self-report text panel
- "Save to product" button: product selector dropdown → uploads to MinIO and attaches

### Tab 2: Product Shoot
- Product selector dropdown (fetches from admin API)
- On select: shows product name, SKU, current thumbnail
- NB2 color config panel (inline-editable, saves to product metadata)
  - Cap color (name + hex picker)
  - Accent color (name + hex picker)
  - Box color (hex, defaults to #6B8399)
  - Form inside (text)
  - Form text (text)
- Variant selector (which variant's dosage/SKU to use in prompts)
- Reference images row: shows 5 thumbnails (product-specific or defaults), each with "Upload custom" overlay
- "Generate All 5 Views" button
- Progress bar: "Generating view 2 of 5 (B_vial_back)..."
- Results grid: 5 cards in a row, each with:
  - Generated image
  - View label (e.g., "A — Vial Front")
  - Self-report expandable
  - "Accept" button (uploads to MinIO + attaches)
  - "Regenerate" button (re-runs just this view)
  - "Regenerate with Pro" button (uses pro model)
  - "Discard" button
- "Accept All" button (batch accept)

## File Structure

```
packages/plugin-ai-studio/
├── src/
│   ├── services/
│   │   └── ai-studio.ts           # AiStudioService (rewrite)
│   ├── api/
│   │   ├── middlewares.ts
│   │   └── admin/ai-studio/
│   │       ├── route.ts           # POST /generate (quick shot)
│   │       ├── shoot/
│   │       │   └── route.ts       # POST /shoot (batch)
│   │       ├── shoot/[view]/
│   │       │   └── route.ts       # POST /shoot/:view (regenerate)
│   │       └── references/[handle]/
│   │           └── route.ts       # GET + POST references
│   ├── prompts/
│   │   ├── preamble.ts            # NB2 preamble constant
│   │   ├── system-block.ts        # CaliLean brand system block
│   │   ├── guard-rails.ts         # Negative prompt
│   │   ├── templates.ts           # 5 view templates (A–E)
│   │   └── builder.ts             # buildPrompt() — assembles all layers
│   ├── workflows/
│   │   └── generate-image.ts      # Existing workflow (updated)
│   ├── admin/
│   │   ├── routes/ai-studio/
│   │   │   └── page.tsx           # Two-tab admin page (rewrite)
│   │   └── components/
│   │       ├── quick-shot.tsx      # Quick Shot tab
│   │       ├── product-shoot.tsx   # Product Shoot tab
│   │       ├── color-config.tsx    # Inline NB2 color editor
│   │       ├── reference-images.tsx # Reference image row
│   │       ├── shoot-results.tsx   # 5-image results grid
│   │       └── image-card.tsx      # Single result with accept/regen/discard
│   └── lib/
│       ├── gemini-client.ts       # HTTP client for Gemini API
│       ├── minio-client.ts        # S3 upload helper
│       └── types.ts               # ViewType, NB2ColorConfig, etc.
```

## Dependencies

Existing:
- `@aws-sdk/client-s3` — MinIO upload (already in backend deps)
- `@medusajs/js-sdk` — admin SDK for product management
- `@medusajs/ui` — admin UI components

No new runtime dependencies needed. The Gemini API is called via native `fetch`.

## Environment Variables

- `GOOGLE_API_KEY` — already configured, gates plugin loading
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` — already configured for file storage

No new env vars needed.

## Initial Setup

After deploying the upgraded plugin:
1. Upload the 5 CL-3R reference images to MinIO at `medusa-media/references/default/`
2. Set `nb2_*` metadata on each product (via admin dashboard or CLI)
3. Run product shoots from the admin dashboard

The CL-3R reference images come from `calilean-assets/cl-3r-*.jpeg` files.

## Out of Scope

- Automated quality scoring of generated images
- Variant-specific reference images (references are per-product, not per-variant)
- Prompt editing in the admin UI for Product Shoot (use Quick Shot for custom prompts)
- Background removal or post-processing
- Integration with slim-studio (the generic Foundry Studio app)
