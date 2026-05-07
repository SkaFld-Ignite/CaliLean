import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { LOYALTY_MODULE, LoyaltyModuleService, getCartLoyaltyPromotion } from "@calilean/plugin-loyalty";
import { CartDTO, PromotionDTO, CustomerDTO } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { FIRST_PURCHASE_PROMOTION_CODE } from "../../constants/first-purchase-discount";

type CartData = CartDTO & {
  promotions?: PromotionDTO[]
  customer?: CustomerDTO
  metadata: {
    loyalty_promo_id?: string
  }
}

completeCartWorkflow.hooks.validate(
  async ({ cart }, { container }) => {
    const query: any = container.resolve("query")

    // --- Loyalty points validation ---
    const loyaltyModuleService: InstanceType<typeof LoyaltyModuleService> = container.resolve(
      LOYALTY_MODULE
    )

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "promotions.*",
        "customer.*",
        "promotions.rules.*",
        "promotions.rules.values.*",
        "promotions.application_method.*",
        "metadata"
      ],
      filters: {
        id: cart.id
      }
    }, {
      throwIfKeyNotFound: true
    })

    const loyaltyPromo = getCartLoyaltyPromotion(carts[0] as unknown as CartData)

    if (loyaltyPromo) {
      const customerLoyaltyPoints = await loyaltyModuleService.getPoints(carts[0].customer!.id)
      const requiredPoints = await loyaltyModuleService.calculatePointsFromAmount(loyaltyPromo.application_method!.value as number)

      if (customerLoyaltyPoints < requiredPoints) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Customer does not have enough loyalty points. Required: ${requiredPoints}, Available: ${customerLoyaltyPoints}`
        )
      }
    }

    // --- First-purchase discount validation ---
    const hasFirstPurchasePromo = cart.promotions?.some(
      (promo: { code?: string }) => promo?.code === FIRST_PURCHASE_PROMOTION_CODE
    )

    if (!hasFirstPurchasePromo) {
      return
    }

    if (!cart.customer_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "First purchase discount can only be applied to carts with a customer"
      )
    }

    const { data: [customer] } = await query.graph({
      entity: "customer",
      fields: ["orders.*", "has_account"],
      filters: {
        id: cart.customer_id
      }
    })

    if (!customer.has_account || (customer?.orders?.length || 0) > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "First purchase discount can only be applied to carts with no previous orders"
      )
    }
  }
)