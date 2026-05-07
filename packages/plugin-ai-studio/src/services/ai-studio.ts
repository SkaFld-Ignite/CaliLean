import { Logger } from "@medusajs/framework/types"
import {
  ViewType,
  ALL_VIEWS,
  NB2Model,
  NB2ColorConfig,
  DEFAULT_COLOR_CONFIG,
  PromptVariables,
  GeminiResult,
  ShootResult,
} from "../lib/types"
import { callGemini } from "../lib/gemini-client"
import { uploadToMinio, fetchFromMinio } from "../lib/minio-client"
import { buildProductPrompt, buildQuickShotPrompt } from "../prompts/builder"

type InjectedDependencies = {
  logger: Logger
}

export type AiStudioOptions = {
  google_api_key: string
}

export interface GenerateImageArgs {
  prompt: string
  model?: NB2Model
  referenceImage?: Buffer
}

export interface ShootProductArgs {
  product: {
    title: string
    handle: string
    metadata?: Record<string, unknown>
  }
  variant: {
    title: string
    sku?: string | null
  }
  views?: ViewType[]
  model?: NB2Model
}

export default class AiStudioService {
  protected logger_: Logger
  protected options_: AiStudioOptions

  constructor({ logger }: InjectedDependencies, options: AiStudioOptions) {
    this.logger_ = logger
    this.options_ = options
  }

  // ---------------------------------------------------------------------------
  // Public: Quick Shot
  // ---------------------------------------------------------------------------

  async generateImage(
    args: GenerateImageArgs
  ): Promise<{ imageBytes: Buffer; mimeType: string; selfReport?: string }> {
    const apiKey = this.requireApiKey()
    const prompt = buildQuickShotPrompt(args.prompt)

    this.logger_.info(
      `[AiStudioService] Quick Shot: model=${args.model ?? "flash"}`
    )

    const result = await callGemini({
      prompt,
      apiKey,
      model: args.model,
      referenceImage: args.referenceImage,
    })

    return {
      imageBytes: result.imageBytes,
      mimeType: result.mimeType,
      selfReport: result.selfReport,
    }
  }

  // ---------------------------------------------------------------------------
  // Public: Product Shoot (batch views)
  // ---------------------------------------------------------------------------

  async shootProduct(args: ShootProductArgs): Promise<ShootResult[]> {
    const apiKey = this.requireApiKey()
    const { product, variant, model } = args
    const views = args.views ?? ALL_VIEWS

    const colorConfig = this.resolveColorConfig(product.metadata)
    const vars = this.buildVariables(product, variant, colorConfig)

    this.logger_.info(
      `[AiStudioService] Product Shoot: handle=${product.handle}, views=${views.join(",")}, model=${model ?? "flash"}`
    )

    const results: ShootResult[] = []

    for (const view of views) {
      const refKey = `references/${product.handle}/${view}.jpg`
      const defaultRefKey = `references/default/${view}.jpg`

      let referenceImage = await fetchFromMinio(refKey)
      if (!referenceImage) {
        referenceImage = await fetchFromMinio(defaultRefKey)
      }

      const prompt = buildProductPrompt(view, vars)

      const geminiResult = await callGemini({
        prompt,
        apiKey,
        model,
        referenceImage: referenceImage ?? undefined,
      })

      const outputKey = `products/${product.handle}/${view}.jpg`
      const url = await uploadToMinio(
        outputKey,
        geminiResult.imageBytes,
        geminiResult.mimeType
      )

      results.push({
        view,
        url,
        selfReport: geminiResult.selfReport ?? "",
      })

      this.logger_.info(
        `[AiStudioService] View ${view} complete -> ${url}`
      )
    }

    return results
  }

  // ---------------------------------------------------------------------------
  // Public: Save quick-shot image to a product
  // ---------------------------------------------------------------------------

  async saveToProduct(imageBytes: Buffer, handle: string): Promise<string> {
    const key = `products/${handle}/quick-shot-${Date.now()}.jpg`
    const url = await uploadToMinio(key, imageBytes, "image/jpeg")

    this.logger_.info(
      `[AiStudioService] Saved quick-shot to ${url}`
    )

    return url
  }

  // ---------------------------------------------------------------------------
  // Public: Get reference image URLs for a product
  // ---------------------------------------------------------------------------

  async getReferences(
    handle: string
  ): Promise<Record<ViewType, string | null>> {
    const result = {} as Record<ViewType, string | null>

    for (const view of ALL_VIEWS) {
      const productRef = await fetchFromMinio(
        `references/${handle}/${view}.jpg`
      )
      if (productRef) {
        result[view] = `references/${handle}/${view}.jpg`
        continue
      }

      const defaultRef = await fetchFromMinio(
        `references/default/${view}.jpg`
      )
      if (defaultRef) {
        result[view] = `references/default/${view}.jpg`
        continue
      }

      result[view] = null
    }

    return result
  }

  // ---------------------------------------------------------------------------
  // Public: Upload a custom reference image
  // ---------------------------------------------------------------------------

  async uploadReference(
    handle: string,
    view: ViewType,
    image: Buffer
  ): Promise<string> {
    const key = `references/${handle}/${view}.jpg`
    const url = await uploadToMinio(key, image, "image/jpeg")

    this.logger_.info(
      `[AiStudioService] Uploaded reference ${view} for ${handle} -> ${url}`
    )

    return url
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private requireApiKey(): string {
    const apiKey = this.options_.google_api_key
    if (!apiKey) {
      throw new Error("google_api_key is required in AiStudio options")
    }
    return apiKey
  }

  private resolveColorConfig(
    metadata?: Record<string, unknown>
  ): NB2ColorConfig {
    if (!metadata) return { ...DEFAULT_COLOR_CONFIG }

    return {
      capColor:
        (metadata.nb2_cap_color as string) ?? DEFAULT_COLOR_CONFIG.capColor,
      capColorName:
        (metadata.nb2_cap_color_name as string) ??
        DEFAULT_COLOR_CONFIG.capColorName,
      accentColor:
        (metadata.nb2_accent_color as string) ??
        DEFAULT_COLOR_CONFIG.accentColor,
      accentColorName:
        (metadata.nb2_accent_color_name as string) ??
        DEFAULT_COLOR_CONFIG.accentColorName,
      boxColor:
        (metadata.nb2_box_color as string) ?? DEFAULT_COLOR_CONFIG.boxColor,
      formInside:
        (metadata.nb2_form_inside as string) ??
        DEFAULT_COLOR_CONFIG.formInside,
      formText:
        (metadata.nb2_form_text as string) ?? DEFAULT_COLOR_CONFIG.formText,
    }
  }

  private buildVariables(
    product: ShootProductArgs["product"],
    variant: ShootProductArgs["variant"],
    colorConfig: NB2ColorConfig
  ): PromptVariables {
    return {
      COMPOUND: product.title,
      DOSAGE: variant.title,
      LOT: variant.sku ?? "NB2-000",
      CAP_COLOR_NAME: colorConfig.capColorName,
      CAP_HEX: colorConfig.capColor,
      ACCENT_COLOR_NAME: colorConfig.accentColorName,
      ACCENT_HEX: colorConfig.accentColor,
      BOX_HEX: colorConfig.boxColor,
      FORM_INSIDE: colorConfig.formInside,
      FORM_TEXT: colorConfig.formText,
    }
  }
}
