import { z } from "@medusajs/framework/zod"

export const PostGenerateImageSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
})

export type PostGenerateImageInput = z.infer<typeof PostGenerateImageSchema>
