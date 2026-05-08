import { model } from "@medusajs/framework/utils"

const QrCampaign = model.define("qr_campaign", {
  id: model.id().primaryKey(),
  code: model.text().unique(),
  name: model.text(),
  destination_url: model.text(),
  utm_source: model.text().default("qr"),
  utm_medium: model.text(),
  utm_campaign: model.text(),
  utm_content: model.text().nullable(),
  scan_count: model.bigNumber().default(0),
  is_active: model.boolean().default(true),
  product_id: model.text().nullable(),
  variant_id: model.text().nullable(),
  notes: model.text().nullable(),
  guest_key: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default QrCampaign
