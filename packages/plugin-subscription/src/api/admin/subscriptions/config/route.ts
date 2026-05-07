import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription/index.js"
import SubscriptionModuleService from "../../../../modules/subscription/service.js"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const config = await service.getSubscriptionConfig()
  res.json({ config })
}

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { discount_rate } = req.body as { discount_rate: number }

  if (typeof discount_rate !== "number" || discount_rate <= 0 || discount_rate >= 1) {
    return res.status(400).json({ message: "discount_rate must be a number between 0 and 1 (e.g. 0.115 for 11.5%)" })
  }

  const service: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const config = await service.updateSubscriptionConfig(discount_rate)
  res.json({ config })
}
