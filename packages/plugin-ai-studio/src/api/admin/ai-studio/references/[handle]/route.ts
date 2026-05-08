import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type AiStudioService from "../../../../../services/ai-studio"
import { ViewType } from "../../../../../lib/types"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const references = await service.getReferences(req.params.handle)
  res.json({ references })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const { view, image } = req.body as { view: string; image: string }
  const url = await service.uploadReference(
    req.params.handle,
    view as ViewType,
    Buffer.from(image, "base64")
  )
  res.json({ url })
}
