import React, { Suspense } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import TrustBadges from "@modules/bluum/components/trust-badges"
import ResearchDisclaimer from "@modules/bluum/components/research-disclaimer"
import ProductSpecsTable from "@modules/bluum/components/product-specs-table"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) return notFound()

  return (
    <>
      <div className="content-container py-8 small:py-12" data-testid="product-container">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-12 items-start">
          <div className="small:sticky small:top-24">
            <ImageGallery images={product?.images || []} />
          </div>

          <div className="flex flex-col gap-y-8">
            <ProductInfo product={product} />

            <Suspense
              fallback={<ProductActions disabled={true} product={product} region={region} />}
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            <TrustBadges />
            <ResearchDisclaimer />
            <ProductSpecsTable product={product} />
          </div>
        </div>
      </div>

      <div className="content-container my-16 small:my-24 border-t border-bluum-border pt-16" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
