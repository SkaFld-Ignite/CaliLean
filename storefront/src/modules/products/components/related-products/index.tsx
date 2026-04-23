import Product from "../product-preview"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const queryParams: Record<string, unknown> = {
    is_giftcard: false,
  }

  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }

  const products = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products.filter((p) => p.id !== product.id).slice(0, 4)
  )

  if (!products.length) return null

  return (
    <div>
      <h2 className="text-2xl small:text-3xl font-bold mb-8">Related Peptides</h2>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-6">
        {products.map((p) => (
          <li key={p.id}>
            <Product region={region} product={p} />
          </li>
        ))}
      </ul>
    </div>
  )
}
