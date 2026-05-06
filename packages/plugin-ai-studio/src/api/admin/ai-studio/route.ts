import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateImageWorkflow } from "../../../workflows/generate-image"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { prompt, aspectRatio, model, seed } = req.body as any

  const { result } = await generateImageWorkflow(req.scope)
    .run({
      input: {
        prompt,
        aspectRatio,
        model,
        seed,
      },
    })

  res.json({
    image: result,
  })
}
