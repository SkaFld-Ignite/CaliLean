import { z } from "@medusajs/framework/zod"

export const PostResyncSchema = z.object({
  entity: z.enum(["order", "customer", "product", "payment"]),
  entity_id: z.string().min(1),
})

export type PostResyncInput = z.infer<typeof PostResyncSchema>
