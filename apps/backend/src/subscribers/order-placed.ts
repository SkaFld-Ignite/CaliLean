import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '@calilean/plugin-email/providers/email-notifications/templates'
import { generateInvoicePdfWorkflow } from '@calilean/plugin-invoices/workflows'
import { handleOrderPointsWorkflow } from '@calilean/plugin-loyalty/workflows'
import { trackOrderPlacedWorkflow } from '../workflows/track-order-placed'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
  const shippingAddress = order.shipping_address
    ? await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)
    : undefined

  // --- Send order confirmation email ---
  try {
    await notificationModuleService.createNotifications({
      to: order.email!,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'hello@calilean.com',
          subject: 'Your order has been placed'
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order!'
      }
    })
  } catch (error) {
    logger.error('Error sending order confirmation notification:', error instanceof Error ? error : new Error(String(error)))
  }

  // --- Generate invoice PDF ---
  try {
    await generateInvoicePdfWorkflow(container).run({
      input: { order_id: data.id }
    })
  } catch (error) {
    logger.error('Error generating invoice PDF:', error instanceof Error ? error : new Error(String(error)))
  }

  // --- Award loyalty points ---
  try {
    await handleOrderPointsWorkflow(container).run({
      input: { order_id: data.id }
    })
  } catch (error) {
    logger.error('Error handling loyalty points:', error instanceof Error ? error : new Error(String(error)))
  }

  // --- Track order placed analytics event (Segment) ---
  try {
    await trackOrderPlacedWorkflow(container).run({
      input: { id: data.id }
    })
  } catch (error) {
    logger.error('Error tracking order placed analytics event:', error instanceof Error ? error : new Error(String(error)))
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
