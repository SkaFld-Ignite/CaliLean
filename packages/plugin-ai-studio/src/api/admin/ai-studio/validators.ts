import { z } from "@medusajs/framework/zod"

export const PostGenerateImageSchema = z.object({
  prompt: z.string().min(1),
  aspectRatio: z.string().optional(),
  model: z.string().optional(),
  seed: z.number().int().optional(),
})

export type PostGenerateImageInput = z.infer<typeof PostGenerateImageSchema>
