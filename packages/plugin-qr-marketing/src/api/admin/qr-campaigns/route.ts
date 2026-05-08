import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import crypto from "crypto"
import { QR_MARKETING_MODULE } from "../../../modules/qr-marketing"
import QrMarketingModuleService from "../../../modules/qr-marketing/service"
import { PostQrCampaignSchemaType } from "../../middlewares"

const QR_FIELDS = [
  "id", "code", "name", "destination_url",
  "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "scan_count", "is_active", "product_id", "variant_id", "notes", "guest_key",
  "created_at", "updated_at",
]

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: QrMarketingModuleService = req.scope.resolve(QR_MARKETING_MODULE)

  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const offset = Number(req.query.offset) || 0
  const orderParam = (req.query.order as string) || "-created_at"
  const orderField = orderParam.startsWith("-") ? orderParam.slice(1) : orderParam
  const orderDir = orderParam.startsWith("-") ? "DESC" : "ASC"

  const [qr_campaigns, count] = await service.listAndCountQrCampaigns(
    {},
    {
      take: limit,
      skip: offset,
      order: { [orderField]: orderDir },
      select: QR_FIELDS,
    }
  )

  res.json({ qr_campaigns, count, limit, offset })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostQrCampaignSchemaType>,
  res: MedusaResponse
) => {
  const service: QrMarketingModuleService = req.scope.resolve(QR_MARKETING_MODULE)

  const { enable_guest_access, ...campaignData } = req.validatedBody

  if (enable_guest_access) {
    ;(campaignData as any).guest_key = crypto.randomBytes(16).toString("hex")
  }

  const qr_campaign = await service.createQrCampaigns(campaignData)

  res.status(201).json({ qr_campaign })
}
