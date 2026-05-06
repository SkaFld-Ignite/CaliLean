import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

export type AiStudioOptions = {
  google_api_key: string
}

export type GenerateImageArgs = {
  prompt: string
  aspectRatio?: "1:1" | "9:16" | "16:9" | "3:4" | "4:3"
  model?: "fast" | "standard" | "ultra"
  seed?: number
}

const MODEL_MAP = {
  fast: "imagen-4.0-fast-generate-001",
  standard: "imagen-4.0-generate-001",
  ultra: "imagen-4.0-ultra-generate-001",
}

export default class AiStudioService {
  protected logger_: Logger
  protected options_: AiStudioOptions

  constructor({ logger }: InjectedDependencies, options: AiStudioOptions) {
    this.logger_ = logger
    this.options_ = options
  }

  async generateImage({
    prompt,
    aspectRatio = "1:1",
    model = "standard",
    seed,
  }: GenerateImageArgs): Promise<{
    base64: string
    mimeType: string
    modelId: string
  }> {
    const apiKey = this.options_.google_api_key
    if (!apiKey) {
      throw new Error("google_api_key is required in AiStudio options")
    }

    const modelId = MODEL_MAP[model] || MODEL_MAP.standard
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict`

    const params: any = {
      sampleCount: 1,
      aspectRatio,
      personGeneration: "dont_allow",
    }
    if (seed) {
      params.seed = seed
    }

    const body = {
      instances: [{ prompt }],
      parameters: params,
    }

    this.logger_.info(
      `[AiStudioService] Generating image: model=${modelId}, aspect=${aspectRatio}`
    )

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      this.logger_.error(
        `[AiStudioService] Google API error: ${response.status} - ${errorText}`
      )
      throw new Error(`Google API error: ${response.status} - ${errorText}`)
    }

    const json = (await response.json()) as any
    const prediction = json.predictions?.[0]

    if (!prediction?.bytesBase64Encoded) {
      this.logger_.error(
        `[AiStudioService] No image bytes in response: ${JSON.stringify(json)}`
      )
      throw new Error("No image bytes in Google API response")
    }

    return {
      base64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || "image/png",
      modelId,
    }
  }
}
