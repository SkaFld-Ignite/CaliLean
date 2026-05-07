import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { syncOrderToErpWorkflow } from "../../../packages/plugin-erp/src/workflows/sync-order-to-erp";

export default async function triggerResync({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderId = "order_01KQPWKV6NHJDH2X3H87CEB658";

  logger.info(`Triggering manual ERP resync for order ${orderId}...`);

  try {
    const result = await syncOrderToErpWorkflow(container).run({
      input: { order_id: orderId, event_name: "order.placed" },
    });
    logger.info("Resync result: " + JSON.stringify(result, null, 2));
  } catch (error: any) {
    logger.error("Resync failed: " + error.message);
  }
}
