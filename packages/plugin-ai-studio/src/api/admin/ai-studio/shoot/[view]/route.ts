import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type AiStudioService from "../../../../../services/ai-studio"
import { PostShootViewInput } from "../../validators"
import { ViewType } from "../../../../../lib/types"

export const POST = async (
  req: MedusaRequest<PostShootViewInput>,
  res: MedusaResponse
) => {
  const service: AiStudioService = req.scope.resolve("aiStudioService")
  const productService = req.scope.resolve(Modules.PRODUCT)
  const view = req.params.view as ViewType
  const { productId, variantId, model } = req.validatedBody

  const product = await productService.retrieveProduct(productId, {
    relations: ["variants"],
  })
  const variant = product.variants?.find((v: any) => v.id === variantId)
  if (!variant) {
    res.status(400).json({ message: `Variant ${variantId} not found` })
    return
  }

  const results = await service.shootProduct({
    product: {
      title: product.title,
      handle: product.handle,
      metadata: product.metadata ?? undefined,
    },
    variant: { title: variant.title, sku: variant.sku },
    model: model as "flash" | "pro" | undefined,
    views: [view],
  })

  res.json({ result: results[0] })
}
