import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import crypto from "crypto"
import { QR_MARKETING_MODULE } from "../../../../modules/qr-marketing"
import QrMarketingModuleService from "../../../../modules/qr-marketing/service"
import { PostQrCampaignUpdateSchemaType } from "../../../middlewares"
import QRCode from "qrcode"

const STOREFRONT_URL = process.env.STOREFRONT_URL || "https://calilean.com"

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
  const { id } = req.params
  const service: QrMarketingModuleService = req.scope.resolve(QR_MARKETING_MODULE)

  const [qr_campaign] = await service.listQrCampaigns(
    { id },
    { select: QR_FIELDS }
  )

  if (!qr_campaign) {
    res.status(404).json({ message: "Campaign not found" })
    return
  }

  const qrUrl = `${STOREFRONT_URL}/go/${qr_campaign.code}`
  const qr_data_url = await QRCode.toDataURL(qrUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  })

  res.json({ qr_campaign, qr_data_url, qr_url: qrUrl })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostQrCampaignUpdateSchemaType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: QrMarketingModuleService = req.scope.resolve(QR_MARKETING_MODULE)

  const { enable_guest_access, ...updateData } = req.validatedBody

  if (enable_guest_access === true) {
    ;(updateData as any).guest_key = crypto.randomBytes(16).toString("hex")
  } else if (enable_guest_access === false) {
    ;(updateData as any).guest_key = null
  }

  await service.updateQrCampaigns({ id, ...updateData })

  // Re-fetch to return consistent, complete data
  const [qr_campaign] = await service.listQrCampaigns(
    { id },
    { select: QR_FIELDS }
  )

  res.json({ qr_campaign })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: QrMarketingModuleService = req.scope.resolve(QR_MARKETING_MODULE)

  await service.deleteQrCampaigns(id)

  res.json({ id, object: "qr_campaign", deleted: true })
}
