import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { QR_MARKETING_MODULE } from "../../../modules/qr-marketing"
import QrMarketingModuleService from "../../../modules/qr-marketing/service"
import { Modules } from "@medusajs/framework/utils"

const STOREFRONT_URL = process.env.STOREFRONT_URL || "https://calilean.com"

/**
 * GET /go/:code
 *
 * Returns campaign data as JSON so the storefront route handler can perform
 * the redirect on the public domain (calilean.com/go/[code]).
 *
 * Also increments scan_count and fires a Segment analytics event as
 * side-effects (fire-and-forget).
 *
 * Response shape:
 *   200 — { campaign, redirect_url }
 *   404 — { error: "..." }
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { code } = req.params
  const service: QrMarketingModuleService = req.scope.resolve(QR_MARKETING_MODULE)

  let campaign
  try {
    const campaigns = await service.listQrCampaigns({ code })
    campaign = campaigns[0]
  } catch {
    return res.status(404).json({ error: "Campaign not found" })
  }

  if (!campaign || !campaign.is_active) {
    return res.status(404).json({ error: "Campaign not found or inactive" })
  }

  // Increment scan count (fire and forget)
  service.incrementScanCount(code).catch(() => {})

  // Track scan via Segment analytics (fire and forget)
  try {
    const analyticsService = req.scope.resolve(Modules.ANALYTICS)
    analyticsService.track({
      event: "qr_code.scanned",
      properties: {
        campaign_code: campaign.code,
        campaign_name: campaign.name,
        destination_url: campaign.destination_url,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        user_agent: req.headers["user-agent"] || "",
        referer: req.headers["referer"] || "",
      },
    }).catch(() => {})
  } catch {
    // Analytics module may not be configured
  }

  // Build redirect URL with UTM params
  const dest = campaign.destination_url.startsWith("http")
    ? campaign.destination_url
    : `${STOREFRONT_URL}${campaign.destination_url}`

  const url = new URL(dest)
  url.searchParams.set("utm_source", campaign.utm_source)
  url.searchParams.set("utm_medium", campaign.utm_medium)
  url.searchParams.set("utm_campaign", campaign.utm_campaign)
  if (campaign.utm_content) {
    url.searchParams.set("utm_content", campaign.utm_content)
  }
  url.searchParams.set("qr_code", campaign.code)

  return res.json({
    campaign: {
      code: campaign.code,
      name: campaign.name,
      destination_url: campaign.destination_url,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      utm_content: campaign.utm_content,
    },
    redirect_url: url.toString(),
    guest_key: campaign.guest_key || null,
  })
}
