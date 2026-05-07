import { MedusaContainer } from "@medusajs/framework/types"
import { sendAbandonedCartsWorkflow } from "../workflows/send-abandoned-carts"

export default async function sendAbandonedCartNotification(
  container: MedusaContainer
) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  let offset = 0
  const limit = 100
  let totalSent = 0

  while (true) {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "updated_at",
        "completed_at",
        "metadata",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "customer.*",
      ],
      filters: {
        updated_at: { $lt: oneDayAgo },
        completed_at: null,
      },
      pagination: { skip: offset, take: limit },
    })

    if (!carts.length) break

    const eligibleCarts = carts.filter(
      (cart: any) =>
        cart.email &&
        cart.items?.length > 0 &&
        !cart.metadata?.abandoned_notification
    )

    if (eligibleCarts.length > 0) {
      try {
        await sendAbandonedCartsWorkflow(container).run({
          input: { carts: eligibleCarts },
        })
        totalSent += eligibleCarts.length
      } catch (error) {
        logger.error("Failed to send abandoned cart notifications:", error instanceof Error ? error : new Error(String(error)))
      }
    }

    if (carts.length < limit) break
    offset += limit
  }

  if (totalSent > 0) {
    logger.info(`Sent ${totalSent} abandoned cart notification(s)`)
  }
}

export const config = {
  name: "send-abandoned-cart-notification",
  schedule: "0 10 * * *",
}
