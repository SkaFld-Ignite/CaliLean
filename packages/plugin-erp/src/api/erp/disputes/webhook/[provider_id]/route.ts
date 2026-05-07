import { createHmac, timingSafeEqual } from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DISPUTE_MODULE } from "../../../../../modules/dispute"

/**
 * Verify the HMAC-SHA256 signature on an incoming webhook request.
 * Returns `true` when verification passes (or when no secret is configured
 * in development — a warning is logged in that case).
 */
function verifyWebhookSignature(
  req: MedusaRequest,
  logger: { warn: (msg: string) => void }
): boolean {
  const secret = process.env.ERP_WEBHOOK_SECRET

  if (!secret) {
    logger.warn(
      "ERP_WEBHOOK_SECRET is not set — dispute webhook is accepting unauthenticated requests. " +
        "Set ERP_WEBHOOK_SECRET in production to enable HMAC verification."
    )
    return true
  }

  const signature = req.headers["x-webhook-signature"] as string | undefined
  if (!signature) {
    return false
  }

  const rawBody: Buffer | undefined = (req as any).rawBody
  if (!rawBody) {
    return false
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")

  // Both values must be the same length for timingSafeEqual
  const sigBuf = Buffer.from(signature, "utf8")
  const expectedBuf = Buffer.from(expected, "utf8")

  if (sigBuf.length !== expectedBuf.length) {
    return false
  }

  return timingSafeEqual(sigBuf, expectedBuf)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { provider_id } = req.params
  const logger = req.scope.resolve("logger")

  if (!verifyWebhookSignature(req, logger)) {
    res.status(401).json({ error: "Invalid webhook signature" })
    return
  }

  try {
    const disputeService = req.scope.resolve(DISPUTE_MODULE) as any
    const body = req.body as Record<string, unknown>

    const dispute = await disputeService.createDisputes({
      status: "open",
      reason: (body.reason as string) || "chargeback",
      amount: body.amount as number,
      currency_code: (body.currency_code as string) || "usd",
      provider_dispute_id: (body.dispute_id as string) || "",
      payment_provider: provider_id,
      evidence_submitted: false,
      metadata: body,
    })

    logger.info(`Dispute created from webhook [${provider_id}]: ${dispute.id}`)
    res.status(200).json({ received: true, dispute_id: dispute.id })
  } catch (error: any) {
    logger.error(`Dispute webhook error [${provider_id}]:`, error)
    res.status(500).json({ error: error.message })
  }
}
