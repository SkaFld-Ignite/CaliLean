import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type AiStudioService from "../../../services/ai-studio"
import { PostGenerateImageInput } from "./validators"

export const POST = async (
  req: MedusaRequest<PostGenerateImageInput>,
  res: MedusaResponse
) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const { prompt, model, referenceImage, saveToProduct } = req.validatedBody

  const result = await service.generateImage({
    prompt,
    model: model as "flash" | "pro" | undefined,
    referenceImage: referenceImage
      ? Buffer.from(referenceImage, "base64")
      : undefined,
  })

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
