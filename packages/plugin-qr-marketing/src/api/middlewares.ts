import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "zod"

export const PostQrCampaignSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1),
  destination_url: z.string().min(1),
  utm_source: z.string().default("qr"),
  utm_medium: z.string().min(1),
  utm_campaign: z.string().min(1),
  utm_content: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  product_id: z.string().nullable().optional(),
  variant_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  enable_guest_access: z.boolean().optional(),
})
export type PostQrCampaignSchemaType = z.infer<typeof PostQrCampaignSchema>

export const PostQrCampaignUpdateSchema = z.object({
  code: z.string().min(1).max(100).optional(),
  name: z.string().min(1).optional(),
  destination_url: z.string().min(1).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().min(1).optional(),
  utm_campaign: z.string().min(1).optional(),
  utm_content: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  product_id: z.string().nullable().optional(),
  variant_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  enable_guest_access: z.boolean().optional(),
})
export type PostQrCampaignUpdateSchemaType = z.infer<typeof PostQrCampaignUpdateSchema>

const validatePostQrCampaignBody = validateAndTransformBody(
  PostQrCampaignSchema as any
)
const validatePostQrCampaignUpdateBody = validateAndTransformBody(
  PostQrCampaignUpdateSchema as any
)

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/qr-campaigns",
      method: ["POST"],
      middlewares: [
        validatePostQrCampaignBody,
      ],
    },
    {
      matcher: "/admin/qr-campaigns/:id",
      method: ["POST"],
      middlewares: [
        validatePostQrCampaignUpdateBody,
      ],
    },
  ],
})
