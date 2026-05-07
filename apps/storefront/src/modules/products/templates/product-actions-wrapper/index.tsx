import { getProductsById } from "@lib/data/products"
import { getSubscriptionConfig } from "@lib/data/subscriptions"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const [product, { discount_rate }] = await Promise.all([
    getProductsById({ ids: [id], regionId: region.id }).then((r) => r[0]),
    getSubscriptionConfig(),
  ])

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      discountRate={discount_rate}
    />
  )
}
