import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import AiStudioService, { GenerateImageArgs } from "../services/ai-studio"

export type GenerateImageWorkflowInput = GenerateImageArgs

export const generateImageStep = createStep(
  "generate-image-step",
  async (input: GenerateImageWorkflowInput, { container }) => {
    const aiStudioService: AiStudioService = container.resolve("aiStudioService")
    const result = await aiStudioService.generateImage(input)
    return new StepResponse(result)
  }
)

export const generateImageWorkflow = createWorkflow(
  "generate-image",
  (input: GenerateImageWorkflowInput) => {
    const result = generateImageStep(input)
    return new WorkflowResponse(result)
  }
)
