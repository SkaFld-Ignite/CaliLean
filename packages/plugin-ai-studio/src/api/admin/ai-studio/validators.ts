import { z } from "@medusajs/framework/zod"

export const PostGenerateImageSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
  referenceImage: z.string().optional(),
  saveToProduct: z.string().optional(),
})
export type PostGenerateImageInput = z.infer<typeof PostGenerateImageSchema>

export const PostShootSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
  views: z
    .array(
      z.enum([
        "A_vial_front",
        "B_vial_back",
        "C_flat_label",
        "D_box_assembled",
        "E_box_dieline",
      ])
    )
    .optional(),
})
export type PostShootInput = z.infer<typeof PostShootSchema>

export const PostShootViewSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  model: z.enum(["flash", "pro"]).optional(),
})
export type PostShootViewInput = z.infer<typeof PostShootViewSchema>
