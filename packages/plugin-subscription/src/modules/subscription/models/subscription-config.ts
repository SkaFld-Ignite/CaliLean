import { model } from "@medusajs/framework/utils"

const SubscriptionConfig = model.define("subscription_config", {
  id: model.id().primaryKey(),
  discount_rate: model.float().default(0.115),
  display_label: model.text().default("11.5%"),
})

export default SubscriptionConfig
