import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const meta = (product.metadata || {}) as Record<string, string>

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm text-bluum-muted hover:text-bluum-text transition-colors"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <h1 className="text-4xl small:text-5xl font-bold tracking-tight" data-testid="product-title">
          {product.title}
        </h1>

        {(meta.batch || meta.report || meta.purity) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {meta.batch && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-bluum-text px-3 py-1.5 rounded-lg text-sm font-medium">
                Batch # {meta.batch}
              </span>
            )}
            {meta.report && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-bluum-text px-3 py-1.5 rounded-lg text-sm font-medium">
                Report # {meta.report}
              </span>
            )}
            {meta.purity && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-bluum-text px-3 py-1.5 rounded-lg text-sm font-medium">
                Tested at {meta.purity}
              </span>
            )}
          </div>
        )}

        {product.description && (
          <p className="text-base text-bluum-muted leading-relaxed whitespace-pre-line" data-testid="product-description">
            {product.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
