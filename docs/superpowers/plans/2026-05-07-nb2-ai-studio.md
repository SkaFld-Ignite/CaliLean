# NB2 AI Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `@calilean/plugin-ai-studio` from a single-prompt Imagen wrapper to a full NB2 product photography pipeline with Quick Shot and Product Shoot modes.

**Architecture:** Rewrite AiStudioService to use Gemini flash/pro models with NB2 prompt templates. Add a Gemini HTTP client, prompt builder with 5 canonical view templates, MinIO upload helper, and new API routes for batch product shoots. The admin page becomes a two-tab UI (Quick Shot + Product Shoot).

**Tech Stack:** TypeScript, Gemini API (gemini-3.1-flash-image-preview), @aws-sdk/client-s3 (MinIO), @medusajs/ui (admin React)

**Spec:** `docs/superpowers/specs/2026-05-07-nb2-ai-studio-design.md`

---

## File Map

```
packages/plugin-ai-studio/src/
├── lib/
│   ├── types.ts                     # ViewType, NB2ColorConfig, GeminiResult, PromptVariables
│   ├── gemini-client.ts             # HTTP client for Gemini streamGenerateContent API
│   └── minio-client.ts             # S3 upload helper for MinIO
├── prompts/
│   ├── preamble.ts                  # NB2_PREAMBLE constant
│   ├── system-block.ts             # SYSTEM_BLOCK constant (CaliLean brand voice)
│   ├── guard-rails.ts              # GUARD_RAILS negative prompt
│   ├── templates.ts                # 5 view templates (A–E) with variable slots
│   └── builder.ts                  # buildPrompt() — assembles all layers + fills variables
├── services/
│   └── ai-studio.ts                # AiStudioService (REWRITE)
├── api/
│   ├── middlewares.ts              # Zod validators for all routes
│   └── admin/ai-studio/
│       ├── route.ts                # POST /generate (quick shot — REWRITE)
│       ├── validators.ts           # Zod schemas (UPDATE)
│       ├── shoot/
│       │   └── route.ts            # POST /shoot (batch 5 views)
│       ├── shoot/[view]/
│       │   └── route.ts            # POST /shoot/:view (regenerate single)
│       └── references/[handle]/
│           └── route.ts            # GET + POST references
├── workflows/
│   └── generate-image.ts           # UPDATE to use new service signature
└── admin/
    ├── lib/sdk.ts                  # Existing (no change)
    ├── routes/ai-studio/
    │   └── page.tsx                # Two-tab admin page (REWRITE)
    └── components/
        ├── quick-shot.tsx          # Quick Shot tab
        ├── product-shoot.tsx       # Product Shoot tab
        ├── color-config.tsx        # Inline NB2 color editor
        ├── reference-images.tsx    # Reference image thumbnails
        ├── shoot-results.tsx       # 5-image results grid
        └── image-card.tsx          # Single result card (accept/regen/discard)
```

---

### Task 1: Types and Gemini client

**Files:**
- Create: `packages/plugin-ai-studio/src/lib/types.ts`
- Create: `packages/plugin-ai-studio/src/lib/gemini-client.ts`

- [ ] **Step 1: Create types**

Create `packages/plugin-ai-studio/src/lib/types.ts`:

```typescript
export type ViewType =
  | "A_vial_front"
  | "B_vial_back"
  | "C_flat_label"
  | "D_box_assembled"
  | "E_box_dieline"

export const ALL_VIEWS: ViewType[] = [
  "A_vial_front",
  "B_vial_back",
  "C_flat_label",
  "D_box_assembled",
  "E_box_dieline",
]

export const VIEW_LABELS: Record<ViewType, string> = {
  A_vial_front: "Vial Front",
  B_vial_back: "Vial Back",
  C_flat_label: "Flat Label",
  D_box_assembled: "Box Assembled",
  E_box_dieline: "Box Dieline",
}

export type NB2Model = "flash" | "pro"

export const MODEL_IDS: Record<NB2Model, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
}

export interface NB2ColorConfig {
  capColor: string       // hex e.g. "#C25B3F"
  capColorName: string   // e.g. "Rust"
  accentColor: string    // hex
  accentColorName: string
  boxColor: string       // hex, default "#6B8399"
  formInside: string     // e.g. "clear liquid with faint yellow tint"
  formText: string       // e.g. "Lyophilized Powder"
}

export const DEFAULT_COLOR_CONFIG: NB2ColorConfig = {
  capColor: "#8B9298",
  capColorName: "Muted Gray",
  accentColor: "#8B9298",
  accentColorName: "Muted Gray",
  boxColor: "#6B8399",
  formInside: "clear liquid",
  formText: "Lyophilized Powder",
}

export interface PromptVariables {
  COMPOUND: string
  DOSAGE: string
  LOT: string
  CAP_COLOR_NAME: string
  CAP_HEX: string
  ACCENT_COLOR_NAME: string
  ACCENT_HEX: string
  BOX_HEX: string
  FORM_INSIDE: string
  FORM_TEXT: string
}

export interface GeminiResult {
  imageBytes: Buffer
  mimeType: string
  selfReport?: string
}

export interface ShootResult {
  view: ViewType
  url: string
  selfReport: string
}
```

- [ ] **Step 2: Create Gemini client**

Create `packages/plugin-ai-studio/src/lib/gemini-client.ts`:

```typescript
import { GeminiResult, MODEL_IDS, NB2Model } from "./types"

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export async function callGemini(args: {
  prompt: string
  apiKey: string
  model?: NB2Model
  referenceImage?: Buffer
}): Promise<GeminiResult> {
  const { prompt, apiKey, model = "flash", referenceImage } = args
  const modelId = MODEL_IDS[model]
  const url = `${API_BASE}/${modelId}:streamGenerateContent?key=${apiKey}`

  // Build request parts
  const parts: Array<Record<string, unknown>> = []

  // Optional reference image (prepended so Gemini treats it as context)
  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: referenceImage.toString("base64"),
      },
    })
  }

  // Text prompt
  parts.push({ text: prompt })

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const json = await response.json() as Array<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> } }> }>

  // Parse streaming response — extract image and text parts
  let imageBytes: Buffer | null = null
  let mimeType = "image/jpeg"
  let selfReport = ""

  for (const chunk of json) {
    for (const candidate of chunk.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          imageBytes = Buffer.from(part.inlineData.data, "base64")
          mimeType = part.inlineData.mimeType || "image/jpeg"
        }
        if (part.text) {
          selfReport += part.text
        }
      }
    }
  }

  if (!imageBytes) {
    throw new Error("No image data found in Gemini response")
  }

  return { imageBytes, mimeType, selfReport: selfReport.trim() || undefined }
}
```

- [ ] **Step 3: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`
Expected: compiles clean

- [ ] **Step 4: Commit**

```bash
git add packages/plugin-ai-studio/src/lib/
git commit -m "feat(ai-studio): add NB2 types and Gemini API client"
```

---

### Task 2: Prompt templates and builder

**Files:**
- Create: `packages/plugin-ai-studio/src/prompts/preamble.ts`
- Create: `packages/plugin-ai-studio/src/prompts/system-block.ts`
- Create: `packages/plugin-ai-studio/src/prompts/guard-rails.ts`
- Create: `packages/plugin-ai-studio/src/prompts/templates.ts`
- Create: `packages/plugin-ai-studio/src/prompts/builder.ts`

- [ ] **Step 1: Create NB2 preamble**

Create `packages/plugin-ai-studio/src/prompts/preamble.ts`:

```typescript
export const NB2_PREAMBLE = `
RENDER PIPELINE: This is a Nano Banana 2 (Gemini 3.1 Flash Image) generation. Use deep reasoning to plan the composition, spatial layout, and material rendering before generating pixels.

COLOR FIDELITY: Maintain accurate neutral white balance and color-accurate product rendering suitable for commercial advertising. Do not apply creative color grading that shifts product-critical colors.

CAMERA SIMULATION: Render as if shot on a medium-format digital camera (Phase One IQ4 150MP equivalent) with precise optics — no barrel distortion, no chromatic aberration, sharp across the frame with natural depth-of-field falloff.

SELF-REPORT: After generating the image, describe what you rendered in a structured report:
- Vial cap color and material
- Box color accuracy
- Label text readability
- Any areas where you approximated or deviated from the reference
This report is used for automated quality assurance — be precise and honest about any uncertainty.
`.trim()
```

- [ ] **Step 2: Create system block**

Create `packages/plugin-ai-studio/src/prompts/system-block.ts`:

```typescript
export const SYSTEM_BLOCK = `You are rendering packaging for CaliLean, a research-use-only peptide
brand based in coastal California. Aesthetic: Aesop apothecary meets a
pharmaceutical research bench. Restrained, ultra-premium, clinical.
Never wellness influencer, never bodybuilder, never stock-medical.
The brand uses a matte steel-blue box (approximately hex 6B8399) with
white printing. Vial labels are off-white stock (Salt hex F4F2EC) with
near-black Iron (hex 1F2326) typography. Each product has a unique
colored aluminum crimp cap and a colored accent mark on the label.
Typography: Plus Jakarta Sans for display and body. JetBrains Mono
for data (lot numbers, dosage, measurements). No serifs. No decorative
fonts. Light: cool diffuse daylight, 5400K, soft and even, no harsh
shadows, no flash. Style: premium pharmaceutical packaging photography,
sharp focus, label perfectly legible.`
```

- [ ] **Step 3: Create guard rails**

Create `packages/plugin-ai-studio/src/prompts/guard-rails.ts`:

```typescript
export const GUARD_RAILS = `DO NOT include: hands, people, lab coats, blue gloves, beakers, test
tubes, syringes, needles, gradient backdrops, marble, wood grain, sand,
gym equipment, bokeh on subject, motion blur, lens flare, HDR look,
instagram filter, neon, watermark, generated text beyond specified label
content, mockup annotations, decorative borders, leaves, droplets.`
```

- [ ] **Step 4: Create view templates**

Create `packages/plugin-ai-studio/src/prompts/templates.ts` — port all 5 prompt templates (A–E) from `calilean-assets/scripts/batch_generate.py`. Each is a template string with `{VARIABLE}` placeholders. The file should export a `VIEW_TEMPLATES` record mapping `ViewType` to template strings. The templates are the exact prompts from the batch script (already explored above). Copy them verbatim, keeping `{COMPOUND}`, `{DOSAGE}`, `{LOT}`, `{CAP_COLOR_NAME}`, `{CAP_HEX}`, `{ACCENT_COLOR_NAME}`, `{ACCENT_HEX}`, `{BOX_HEX}`, `{FORM_INSIDE}`, `{FORM_TEXT}` as placeholders, but REMOVE the `{SYSTEM_BLOCK}` and `{GUARD_RAILS}` placeholders since those are appended by the builder.

Read the full templates from `/Users/charlessims/projects/skafldstudio/internal/calilean-assets/scripts/batch_generate.py` (the `PROMPTS` dict, lines ~24–200) and port them.

- [ ] **Step 5: Create prompt builder**

Create `packages/plugin-ai-studio/src/prompts/builder.ts`:

```typescript
import { ViewType, PromptVariables } from "../lib/types"
import { NB2_PREAMBLE } from "./preamble"
import { SYSTEM_BLOCK } from "./system-block"
import { GUARD_RAILS } from "./guard-rails"
import { VIEW_TEMPLATES } from "./templates"

function fillTemplate(template: string, vars: PromptVariables): string {
  return template
    .replace(/\{COMPOUND\}/g, vars.COMPOUND)
    .replace(/\{DOSAGE\}/g, vars.DOSAGE)
    .replace(/\{LOT\}/g, vars.LOT)
    .replace(/\{CAP_COLOR_NAME\}/g, vars.CAP_COLOR_NAME)
    .replace(/\{CAP_HEX\}/g, vars.CAP_HEX)
    .replace(/\{ACCENT_COLOR_NAME\}/g, vars.ACCENT_COLOR_NAME)
    .replace(/\{ACCENT_HEX\}/g, vars.ACCENT_HEX)
    .replace(/\{BOX_HEX\}/g, vars.BOX_HEX)
    .replace(/\{FORM_INSIDE\}/g, vars.FORM_INSIDE)
    .replace(/\{FORM_TEXT\}/g, vars.FORM_TEXT)
}

export function buildProductPrompt(view: ViewType, vars: PromptVariables): string {
  const template = VIEW_TEMPLATES[view]
  const filled = fillTemplate(template, vars)
  return [NB2_PREAMBLE, "", SYSTEM_BLOCK, "", filled, "", GUARD_RAILS].join("\n")
}

export function buildQuickShotPrompt(userPrompt: string): string {
  return [NB2_PREAMBLE, "", SYSTEM_BLOCK, "", userPrompt, "", GUARD_RAILS].join("\n")
}
```

- [ ] **Step 6: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`
Expected: compiles clean

- [ ] **Step 7: Commit**

```bash
git add packages/plugin-ai-studio/src/prompts/
git commit -m "feat(ai-studio): add NB2 prompt templates (5 views) and builder"
```

---

### Task 3: MinIO upload helper

**Files:**
- Create: `packages/plugin-ai-studio/src/lib/minio-client.ts`

- [ ] **Step 1: Create MinIO client**

Create `packages/plugin-ai-studio/src/lib/minio-client.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

let s3Client: S3Client | null = null

function getClient(): S3Client {
  if (s3Client) return s3Client

  const endpoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("MinIO not configured — set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY")
  }

  s3Client = new S3Client({
    endpoint: `https://${endpoint}`,
    region: "us-east-1",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  })

  return s3Client
}

function getBucket(): string {
  return process.env.MINIO_BUCKET || "medusa-media"
}

export async function uploadToMinio(
  key: string,
  body: Buffer,
  contentType = "image/jpeg"
): Promise<string> {
  const client = getClient()
  const bucket = getBucket()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    })
  )

  const endpoint = process.env.MINIO_ENDPOINT
  return `https://${endpoint}/${bucket}/${key}`
}

export async function fetchFromMinio(key: string): Promise<Buffer | null> {
  try {
    const client = getClient()
    const bucket = getBucket()

    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    )

    if (!result.Body) return null

    const chunks: Uint8Array[] = []
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Add @aws-sdk/client-s3 dependency if missing**

Check `packages/plugin-ai-studio/package.json` — if `@aws-sdk/client-s3` is not in dependencies, add it. It's already in the backend's deps at `^3.700.0`.

- [ ] **Step 3: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add packages/plugin-ai-studio/src/lib/minio-client.ts packages/plugin-ai-studio/package.json
git commit -m "feat(ai-studio): add MinIO upload/fetch helper for product images"
```

---

### Task 4: Rewrite AiStudioService

**Files:**
- Modify: `packages/plugin-ai-studio/src/services/ai-studio.ts` (full rewrite)

- [ ] **Step 1: Rewrite the service**

Rewrite `packages/plugin-ai-studio/src/services/ai-studio.ts`. Read the existing file first. The new service has:

- `generateImage(args)` — Quick Shot: builds prompt with `buildQuickShotPrompt`, calls `callGemini`, optionally uploads to MinIO. Returns `{ imageBytes, mimeType, url?, selfReport }`.

- `shootProduct(args: { productId, variantId, views?, model? })` — Product Shoot: resolves product data from Medusa (`container.resolve(Modules.PRODUCT)`), extracts NB2ColorConfig from `product.metadata.nb2_*` fields, builds `PromptVariables`, fetches reference images from MinIO, calls `callGemini` for each view (with reference), uploads results to MinIO at `products/{handle}/{view}.jpg`, attaches to product images via product module. Returns `ShootResult[]`.

- `getReferences(handle)` — checks MinIO for product-specific references at `references/{handle}/`, falls back to `references/default/`. Returns `Record<ViewType, string | null>`.

- `uploadReference(handle, view, image)` — uploads to MinIO at `references/{handle}/{view}.jpg`.

Key internals:
- `resolveColorConfig(product)` — reads `nb2_*` metadata, falls back to `DEFAULT_COLOR_CONFIG`
- `buildVariables(product, variant, colorConfig)` — creates `PromptVariables` from product/variant data
- Uses `callGemini` from `lib/gemini-client.ts`
- Uses `uploadToMinio` and `fetchFromMinio` from `lib/minio-client.ts`
- Uses `buildProductPrompt` and `buildQuickShotPrompt` from `prompts/builder.ts`

Constructor receives `{ logger }` and `options: { google_api_key }` — same pattern as before.

- [ ] **Step 2: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add packages/plugin-ai-studio/src/services/ai-studio.ts
git commit -m "feat(ai-studio): rewrite service with NB2 Quick Shot and Product Shoot"
```

---

### Task 5: API routes — generate, shoot, references

**Files:**
- Modify: `packages/plugin-ai-studio/src/api/admin/ai-studio/route.ts`
- Modify: `packages/plugin-ai-studio/src/api/admin/ai-studio/validators.ts`
- Modify: `packages/plugin-ai-studio/src/api/middlewares.ts`
- Create: `packages/plugin-ai-studio/src/api/admin/ai-studio/shoot/route.ts`
- Create: `packages/plugin-ai-studio/src/api/admin/ai-studio/shoot/[view]/route.ts`
- Create: `packages/plugin-ai-studio/src/api/admin/ai-studio/references/[handle]/route.ts`
- Modify: `packages/plugin-ai-studio/src/workflows/generate-image.ts`

- [ ] **Step 1: Update validators**

Update `packages/plugin-ai-studio/src/api/admin/ai-studio/validators.ts`:

```typescript
import { z } from "@medusajs/framework/zod"

export const PostGenerateImageSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "3:4", "4:3"]).optional(),
  referenceImage: z.string().optional(), // base64
  saveToProduct: z.string().optional(), // product handle to attach to
})
export type PostGenerateImageInput = z.infer<typeof PostGenerateImageSchema>

export const PostShootSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
  views: z.array(z.enum([
    "A_vial_front", "B_vial_back", "C_flat_label",
    "D_box_assembled", "E_box_dieline",
  ])).optional(),
})
export type PostShootInput = z.infer<typeof PostShootSchema>

export const PostShootViewSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
})
export type PostShootViewInput = z.infer<typeof PostShootViewSchema>
```

- [ ] **Step 2: Update middlewares**

Read and update `packages/plugin-ai-studio/src/api/middlewares.ts` to register validation for the new routes:

```typescript
import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostGenerateImageSchema, PostShootSchema, PostShootViewSchema } from "./admin/ai-studio/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/ai-studio",
      method: "POST",
      middlewares: [validateAndTransformBody(PostGenerateImageSchema)],
    },
    {
      matcher: "/admin/ai-studio/shoot",
      method: "POST",
      middlewares: [validateAndTransformBody(PostShootSchema)],
    },
    {
      matcher: "/admin/ai-studio/shoot/:view",
      method: "POST",
      middlewares: [validateAndTransformBody(PostShootViewSchema)],
    },
  ],
})
```

- [ ] **Step 3: Update generate route (Quick Shot)**

Rewrite `packages/plugin-ai-studio/src/api/admin/ai-studio/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type AiStudioService from "../../../services/ai-studio"
import { PostGenerateImageInput } from "./validators"

export const POST = async (
  req: MedusaRequest<PostGenerateImageInput>,
  res: MedusaResponse
) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const { prompt, model, aspectRatio, referenceImage, saveToProduct } = req.validatedBody

  const result = await service.generateImage({
    prompt,
    model: model as "flash" | "pro" | undefined,
    referenceImage: referenceImage ? Buffer.from(referenceImage, "base64") : undefined,
  })

  // Optionally save to a product
  let url: string | undefined
  if (saveToProduct) {
    url = await service.saveToProduct(result.imageBytes, saveToProduct)
  }

  res.json({
    image: {
      base64: result.imageBytes.toString("base64"),
      mimeType: result.mimeType,
      url,
    },
    selfReport: result.selfReport,
  })
}
```

- [ ] **Step 4: Create shoot route (Product Shoot)**

Create `packages/plugin-ai-studio/src/api/admin/ai-studio/shoot/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type AiStudioService from "../../../../services/ai-studio"
import { PostShootInput } from "../validators"

export const POST = async (
  req: MedusaRequest<PostShootInput>,
  res: MedusaResponse
) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const { productId, variantId, model, views } = req.validatedBody

  const results = await service.shootProduct({
    productId,
    variantId,
    model: model as "flash" | "pro" | undefined,
    views,
  })

  res.json({ results })
}
```

- [ ] **Step 5: Create shoot/[view] route (regenerate single)**

Create `packages/plugin-ai-studio/src/api/admin/ai-studio/shoot/[view]/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type AiStudioService from "../../../../../services/ai-studio"
import { PostShootViewInput } from "../../validators"
import { ViewType } from "../../../../../lib/types"

export const POST = async (
  req: MedusaRequest<PostShootViewInput>,
  res: MedusaResponse
) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const view = req.params.view as ViewType
  const { productId, variantId, model } = req.validatedBody

  const results = await service.shootProduct({
    productId,
    variantId,
    model: model as "flash" | "pro" | undefined,
    views: [view],
  })

  res.json({ result: results[0] })
}
```

- [ ] **Step 6: Create references route**

Create `packages/plugin-ai-studio/src/api/admin/ai-studio/references/[handle]/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type AiStudioService from "../../../../../services/ai-studio"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const handle = req.params.handle

  const references = await service.getReferences(handle)
  res.json({ references })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const handle = req.params.handle
  const { view, image } = req.body as { view: string; image: string }

  const url = await service.uploadReference(
    handle,
    view as any,
    Buffer.from(image, "base64")
  )

  res.json({ url })
}
```

- [ ] **Step 7: Update the generate-image workflow**

Read and update `packages/plugin-ai-studio/src/workflows/generate-image.ts` to match the new service signature. The workflow step should call `service.generateImage()` with the new args shape.

- [ ] **Step 8: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`

- [ ] **Step 9: Commit**

```bash
git add packages/plugin-ai-studio/src/api/ packages/plugin-ai-studio/src/workflows/
git commit -m "feat(ai-studio): add shoot, regenerate, references API routes"
```

---

### Task 6: Admin UI — page shell with tabs

**Files:**
- Modify: `packages/plugin-ai-studio/src/admin/routes/ai-studio/page.tsx` (rewrite)

- [ ] **Step 1: Rewrite the admin page as a two-tab layout**

Read the existing `page.tsx` first. Rewrite it as a tabbed layout using `@medusajs/ui` Tabs component (or manual tab state if Tabs isn't available in the admin SDK). The page renders two tabs: "Quick Shot" and "Product Shoot", each rendering a placeholder component that we'll build in the next tasks.

```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Container, Heading, Toaster } from "@medusajs/ui"
import { useState } from "react"
import { QuickShot } from "../../components/quick-shot"
import { ProductShoot } from "../../components/product-shoot"

const TABS = [
  { id: "quick-shot", label: "Quick Shot" },
  { id: "product-shoot", label: "Product Shoot" },
] as const

const AiStudioPage = () => {
  const [activeTab, setActiveTab] = useState<string>("quick-shot")

  return (
    <div className="flex flex-col gap-y-4">
      <Container>
        <Heading>AI Studio</Heading>
        <div className="flex gap-x-2 mt-4 border-b border-ui-border-base">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-ui-fg-base text-ui-fg-base"
                  : "border-transparent text-ui-fg-muted hover:text-ui-fg-subtle"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Container>

      {activeTab === "quick-shot" && <QuickShot />}
      {activeTab === "product-shoot" && <ProductShoot />}

      <Toaster />
    </div>
  )
}

export const config = defineRouteConfig({ label: "AI Studio", icon: Photo })
export default AiStudioPage
```

- [ ] **Step 2: Create stub components**

Create `packages/plugin-ai-studio/src/admin/components/quick-shot.tsx`:
```tsx
import { Container, Text } from "@medusajs/ui"
export const QuickShot = () => <Container><Text>Quick Shot — coming next task</Text></Container>
```

Create `packages/plugin-ai-studio/src/admin/components/product-shoot.tsx`:
```tsx
import { Container, Text } from "@medusajs/ui"
export const ProductShoot = () => <Container><Text>Product Shoot — coming next task</Text></Container>
```

- [ ] **Step 3: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add packages/plugin-ai-studio/src/admin/
git commit -m "feat(ai-studio): add two-tab admin page shell (Quick Shot + Product Shoot)"
```

---

### Task 7: Admin UI — Quick Shot tab

**Files:**
- Modify: `packages/plugin-ai-studio/src/admin/components/quick-shot.tsx` (full implementation)

- [ ] **Step 1: Implement Quick Shot component**

Rewrite `quick-shot.tsx` with: prompt textarea, model selector (Flash/Pro), aspect ratio selector, optional reference image file input, generate button with loading state, result image display, self-report expandable text, "Save to product" button with product handle input. Uses `sdk.client.fetch` to call `POST /admin/ai-studio`. The response returns `image.base64` which is displayed as `data:` URL, and optionally `image.url` if saved.

Port the UI patterns from the existing `page.tsx` (textarea, selects, image display) but update to match the new API response shape.

- [ ] **Step 2: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add packages/plugin-ai-studio/src/admin/components/quick-shot.tsx
git commit -m "feat(ai-studio): implement Quick Shot tab with NB2 model selector"
```

---

### Task 8: Admin UI — Product Shoot tab (main)

**Files:**
- Modify: `packages/plugin-ai-studio/src/admin/components/product-shoot.tsx` (full implementation)
- Create: `packages/plugin-ai-studio/src/admin/components/color-config.tsx`
- Create: `packages/plugin-ai-studio/src/admin/components/image-card.tsx`
- Create: `packages/plugin-ai-studio/src/admin/components/shoot-results.tsx`
- Create: `packages/plugin-ai-studio/src/admin/components/reference-images.tsx`

- [ ] **Step 1: Create ColorConfig component**

Create `packages/plugin-ai-studio/src/admin/components/color-config.tsx` — inline editor for NB2 color metadata. Fields: cap color name + hex, accent color name + hex, box color hex, form inside text, form text. Each field is a text input. Shows color swatches next to hex inputs. Saves to product metadata via `sdk.client.fetch("POST", "/admin/products/{id}", { metadata: { nb2_*: values } })`.

- [ ] **Step 2: Create ImageCard component**

Create `packages/plugin-ai-studio/src/admin/components/image-card.tsx` — single result card showing: generated image, view label, expandable self-report, "Accept" button (calls `POST /admin/ai-studio/shoot/:view` with accept flag or the parent handles MinIO upload), "Regenerate" button, "Regenerate with Pro" button, "Discard" button.

- [ ] **Step 3: Create ShootResults component**

Create `packages/plugin-ai-studio/src/admin/components/shoot-results.tsx` — grid of 5 ImageCard components, one per view. "Accept All" button at the top. Receives `results` array as prop.

- [ ] **Step 4: Create ReferenceImages component**

Create `packages/plugin-ai-studio/src/admin/components/reference-images.tsx` — row of 5 small thumbnails showing current reference images for the selected product. Each thumbnail has an "Upload custom" overlay. Fetches from `GET /admin/ai-studio/references/{handle}`.

- [ ] **Step 5: Implement ProductShoot component**

Rewrite `product-shoot.tsx`: product selector (fetches products from `/admin/products`), variant selector, ColorConfig panel, ReferenceImages row, "Generate All 5 Views" button, progress indicator ("Generating view 2 of 5..."), ShootResults grid. Calls `POST /admin/ai-studio/shoot` with productId, variantId, model.

- [ ] **Step 6: Verify build**

Run: `cd packages/plugin-ai-studio && pnpm build`

- [ ] **Step 7: Commit**

```bash
git add packages/plugin-ai-studio/src/admin/components/
git commit -m "feat(ai-studio): implement Product Shoot tab with color config and results grid"
```

---

### Task 9: Upload default references + full build verification

**Files:**
- No new source files — this is an integration/verification task

- [ ] **Step 1: Copy CL-3R reference images to a staging location**

The 5 reference images from `calilean-assets` need to be uploaded to MinIO at `medusa-media/references/default/`. The files are:

- `/Users/charlessims/projects/skafldstudio/internal/calilean-assets/cl-3r-hero.jpeg_202605052241.jpeg` → `references/default/A_vial_front.jpg`
- `/Users/charlessims/projects/skafldstudio/internal/calilean-assets/cl-3r-vial.jpeg_202605052241.jpeg` → `references/default/B_vial_back.jpg`
- `/Users/charlessims/projects/skafldstudio/internal/calilean-assets/cl-3r-flat-label.jpeg_202605052241.jpeg` → `references/default/C_flat_label.jpg`
- `/Users/charlessims/projects/skafldstudio/internal/calilean-assets/cl-3r-boxes-assembled.jpeg_202605052241.jpeg` → `references/default/D_box_assembled.jpg`
- `/Users/charlessims/projects/skafldstudio/internal/calilean-assets/cl-3r-dielines.jpeg_202605052241.jpeg` → `references/default/E_box_dieline.jpg`

Write a one-time script `scripts/upload-references.sh` that uploads these to the production MinIO bucket using the AWS CLI or a Node script. The MinIO credentials come from Doppler (`prd_backend` config).

- [ ] **Step 2: Full monorepo build**

Run: `cd /Users/charlessims/projects/skafldstudio/internal/CaliLean && pnpm turbo build --force`
Expected: all 14 tasks pass (including plugin-ai-studio)

- [ ] **Step 3: Run all tests**

Run: `pnpm turbo test`
Expected: all existing tests pass

- [ ] **Step 4: Test Quick Shot against local Medusa**

With backend running on localhost:9000, navigate to the admin dashboard `/app/ai-studio`, use the Quick Shot tab to generate an image. Verify:
- Model selector shows Flash/Pro
- Image generates and displays
- Self-report text appears

- [ ] **Step 5: Test Product Shoot**

Select a product (e.g., BPC-157 5mg), verify:
- Color config loads from product metadata (or shows defaults)
- Reference images section shows defaults (or placeholder if not uploaded)
- "Generate All 5 Views" triggers batch generation
- Results grid shows 5 images
- Accept uploads to MinIO and attaches to product

- [ ] **Step 6: Commit upload script and push**

```bash
git add scripts/upload-references.sh
git commit -m "feat(ai-studio): add reference upload script, verify full NB2 pipeline"
git push origin master
```

---

## Summary

| Task | Component | Files | Complexity |
|------|-----------|-------|------------|
| 1 | Types + Gemini client | 2 create | Low |
| 2 | Prompt templates + builder | 5 create | Medium (porting prompts) |
| 3 | MinIO upload helper | 1 create | Low |
| 4 | AiStudioService rewrite | 1 modify | High (core logic) |
| 5 | API routes | 5 create, 3 modify | Medium |
| 6 | Admin page shell + tabs | 3 modify/create | Low |
| 7 | Quick Shot tab | 1 modify | Medium |
| 8 | Product Shoot tab + components | 5 create, 1 modify | High (most UI) |
| 9 | References upload + verification | 1 create, integration | Medium |

**Total: ~25 files, 9 tasks**
