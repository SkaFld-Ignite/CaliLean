import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription/index.js"
import SubscriptionModuleService from "../../../../modules/subscription/service.js"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const config = await service.getSubscriptionConfig()
  res.json({ config })
}
