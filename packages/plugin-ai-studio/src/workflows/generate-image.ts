import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import AiStudioService from "../services/ai-studio"
import type { NB2Model } from "../lib/types"

export type GenerateImageWorkflowInput = {
  prompt: string
  model?: NB2Model
  referenceImage?: string // base64
}

export const generateImageStep = createStep(
  "generate-image-step",
  async (input: GenerateImageWorkflowInput, { container }) => {
    const aiStudioService: AiStudioService =
      container.resolve("aiStudioService")

    const result = await aiStudioService.generateImage({
      prompt: input.prompt,
      model: input.model,
      referenceImage: input.referenceImage
        ? Buffer.from(input.referenceImage, "base64")
        : undefined,
    })

    return new StepResponse({
      base64: result.imageBytes.toString("base64"),
      mimeType: result.mimeType,
      selfReport: result.selfReport,
    })
  }
)

export const generateImageWorkflow = createWorkflow(
  "generate-image",
  (input: GenerateImageWorkflowInput) => {
    const result = generateImageStep(input)
    return new WorkflowResponse(result)
  }
)
