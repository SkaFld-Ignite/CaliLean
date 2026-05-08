import React, { Suspense } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import TrustBadges from "@modules/calilean/components/trust-badges"
import RUODisclaimer from "@modules/common/components/ruo-disclaimer"
import ProductSpecsTable from "@modules/calilean/components/product-specs-table"
import COAPanel from "@modules/products/components/coa-panel"
import ResearchLayout from "@modules/calilean/components/research-layout"
import ProductReviews from "@modules/products/components/reviews"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import { getResearchContent } from "@lib/mdx"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) return notFound()

  const research = await getResearchContent({
    productId: product.id,
    handle: product.handle || "",
  })

  return (
    <>
      {/* Hero section — unchanged */}
      <div
        className="content-container py-8 small:py-12"
        data-testid="product-container"
      >
        <div className="grid grid-cols-1 small:grid-cols-2 gap-12 items-start">
          <div className="small:sticky small:top-24">
            <ImageGallery images={product?.images || []} />
          </div>

          <div className="flex flex-col gap-y-8">
            <ProductInfo product={product} />

            <Suspense
              fallback={
                <div className="flex flex-col gap-y-4 animate-pulse">
                  <div className="h-10 bg-ui-bg-subtle rounded" />
                  <div className="h-10 bg-ui-bg-subtle rounded w-1/2" />
                </div>
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            <TrustBadges />
            <RUODisclaimer variant="short" />

            {/* If no research content, show specs and COA inline (existing layout) */}
            {!research && (
              <>
                <ProductSpecsTable product={product} />
                <COAPanel product={product} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Research content section — only renders when MDX exists */}
      {research && (
        <ResearchLayout headings={research.headings}>
          {research.content}
          <ProductSpecsTable product={product} />
          <COAPanel product={product} />
        </ResearchLayout>
      )}

      {/* Product reviews */}
      <div
        id="reviews"
        className="content-container my-16 small:my-24 border-t border-calilean-sand pt-16 scroll-mt-24"
      >
        <ProductReviews productId={product.id} />
      </div>

      {/* Related products — unchanged */}
      <div
        className="content-container my-16 small:my-24 border-t border-calilean-sand pt-16"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
