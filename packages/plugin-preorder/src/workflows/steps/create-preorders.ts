import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type StepInput = {
  preorder_variant_ids: string[]
  order_id: string
}

export const createPreordersStep = createStep(
  "create-preorders",
  async ({
    preorder_variant_ids,
    order_id
  }: StepInput, { container }) => {
    const preorderModuleService = container.resolve("preorder") as any

    const preorders = await preorderModuleService.createPreorders(
      preorder_variant_ids.map((id) => ({
        item_id: id,
        order_id
      }))
    )

    return new StepResponse(preorders, preorders.map((p: { id: string }) => p.id))
  },
  async (preorderIds, { container }) => {
    if (!preorderIds) {
      return
    }

    const preorderModuleService = container.resolve("preorder") as any

    await preorderModuleService.deletePreorders(preorderIds)
  }
)
