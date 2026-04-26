import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"

type RuoAttestation = {
  agreed: boolean
  version: string
  label: string
  agreed_at: string
}

export default async function ruoAttestationAuditHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  )

  const order = await orderModuleService.retrieveOrder(data.id)
  const attestation = (order.metadata as Record<string, unknown> | null)
    ?.ruo_attestation as RuoAttestation | null | undefined

  if (!attestation || attestation.agreed !== true) {
    logger.error(
      `[RUO] order ${order.id} placed without attestation — frontend gate bypassed or cart metadata stripped`
    )
    return
  }

  logger.info(
    `[RUO] order ${order.id} attestation v${attestation.version} agreed at ${attestation.agreed_at}`
  )
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
