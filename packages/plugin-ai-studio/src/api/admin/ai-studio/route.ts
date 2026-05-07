import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateImageWorkflow } from "../../../workflows/generate-image"
import { PostGenerateImageInput } from "./validators"

export const POST = async (
  req: MedusaRequest<PostGenerateImageInput>,
  res: MedusaResponse
) => {
  const { prompt, aspectRatio, model, seed } = req.validatedBody

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
