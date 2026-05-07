import { z } from "@medusajs/framework/zod"

export const PostGenerateImageSchema = z.object({
  prompt: z.string().min(1),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "3:4", "4:3"]).optional(),
  model: z.enum(["fast", "standard", "ultra"]).optional(),
  seed: z.number().int().optional(),
})

export type PostGenerateImageInput = z.infer<typeof PostGenerateImageSchema>
