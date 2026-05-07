import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  applyBatchPatch,
  CoaPanelPatchInput,
  deleteBatch,
} from "./helpers"

type ProductWithMetadata = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

async function loadProduct(
  req: MedusaRequest,
  productId: string
): Promise<ProductWithMetadata | null> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { id: productId },
  })
  return (data?.[0] as ProductWithMetadata | undefined) ?? null
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const productId = req.params.id
  const body = (req.body || {}) as CoaPanelPatchInput
  if (!body.batch_id || typeof body.batch_id !== "string") {
    res.status(400).json({ message: "batch_id is required" })
    return
  }

  const product = await loadProduct(req, productId)
  if (!product) {
    res.status(404).json({ message: `Product ${productId} not found` })
    return
  }

  const nextPanel = applyBatchPatch(product.metadata?.coa_panel, body)
  const nextMetadata = {
    ...(product.metadata || {}),
    coa_panel: nextPanel,
  }

  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  await productModuleService.updateProducts(productId, {
    metadata: nextMetadata,
  })

  res.json({ coa_panel: nextPanel })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const productId = req.params.id
  const batchId =
    typeof req.query.batch_id === "string" ? req.query.batch_id : ""
  if (!batchId) {
    res
      .status(400)
      .json({ message: "batch_id query parameter is required" })
    return
  }

  const product = await loadProduct(req, productId)
  if (!product) {
    res.status(404).json({ message: `Product ${productId} not found` })
    return
  }

  const nextPanel = deleteBatch(product.metadata?.coa_panel, batchId)
  const nextMetadata = {
    ...(product.metadata || {}),
    coa_panel: nextPanel,
  }

  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  await productModuleService.updateProducts(productId, {
    metadata: nextMetadata,
  })

  res.json({ coa_panel: nextPanel })
}
