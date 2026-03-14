import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="py-12">
      <div className="content-container">
        <div className="text-center mb-12">
          <h1 className="text-3xl small:text-4xl font-bold" data-testid="store-page-title">
            Shop All Peptides
          </h1>
          <p className="text-bluum-muted mt-2">Research-grade peptides, third-party tested, shipped from the USA.</p>
        </div>
        <div className="flex flex-col small:flex-row small:items-start gap-8">
          <RefinementList sortBy={sort} />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={countryCode}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
