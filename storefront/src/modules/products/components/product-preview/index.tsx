import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) return null

  const { cheapestPrice } = getProductPrice({ product: pricedProduct })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
      <div className="border border-bluum-border rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="square"
          isFeatured={isFeatured}
        />
        <div className="p-4">
          <h3 className="text-base font-semibold text-bluum-text" data-testid="product-title">
            {product.title}
          </h3>
          <div className="mt-1">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
