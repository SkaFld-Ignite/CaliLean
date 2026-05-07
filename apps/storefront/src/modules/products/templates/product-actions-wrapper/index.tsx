import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const product = await getProductsById({
    ids: [id],
    regionId: region.id,
  }).then((r) => r[0])

  if (!product) {
    return null
  }

  return <ProductActions product={product} region={region} />
}
