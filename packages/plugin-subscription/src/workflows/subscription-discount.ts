import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PromotionActions } from "@medusajs/framework/utils"
import {
  updateCartPromotionsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

const SUBSCRIPTION_PROMOTION_CODE = "SUBSCRIBE_SAVE_15"

type WorkflowInput = {
  cart_id: string
  action: "add" | "remove"
}

export const subscriptionDiscountWorkflow = createWorkflow(
  "subscription-discount",
  function (input: WorkflowInput) {
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: ["id", "promotions.*"],
      filters: {
        id: input.cart_id,
      },
    })

    const { data: promotions } = useQueryGraphStep({
      entity: "promotion",
      fields: ["code"],
      filters: {
        code: SUBSCRIPTION_PROMOTION_CODE,
      },
    }).config({ name: "retrieve-promotions" })

    when(
      {
        input,
        carts,
        promotions,
      },
      (data) => {
        const hasPromo = data.carts[0].promotions?.some(
          (promo: { code?: string }) => promo?.code === SUBSCRIPTION_PROMOTION_CODE
        )

        return (
          data.promotions.length > 0 &&
          ((data.input.action === "add" && !hasPromo) ||
            (data.input.action === "remove" && hasPromo))
        )
      }
    ).then(() => {
      updateCartPromotionsStep({
        id: input.cart_id,
        promo_codes: [SUBSCRIPTION_PROMOTION_CODE],
        action:
          input.action === "add" ? PromotionActions.ADD : PromotionActions.REMOVE,
      })
    })

    return new WorkflowResponse({ success: true })
  }
)
