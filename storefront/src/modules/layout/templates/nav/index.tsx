import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import AnnouncementBar from "@modules/bluum/components/announcement-bar"
import CaliLeanLogo from "@modules/calilean/icons/calilean-logo"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <>
      <AnnouncementBar />
      <div className="sticky top-0 inset-x-0 z-50">
        <header className="relative h-16 mx-auto border-b border-bluum-border bg-bluum-bg">
          <nav className="content-container flex items-center justify-between w-full h-full text-sm">
            <div className="flex-1 basis-0 h-full flex items-center">
              <div className="h-full block small:hidden">
                <SideMenu regions={regions} />
              </div>
              <div className="hidden small:flex items-center gap-x-8 h-full">
                <LocalizedClientLink href="/" className="font-medium text-bluum-text hover:opacity-70 transition-opacity">
                  Home
                </LocalizedClientLink>
                <LocalizedClientLink href="/store" className="font-medium text-bluum-text hover:opacity-70 transition-opacity">
                  Peptides
                </LocalizedClientLink>
              </div>
            </div>

            <div className="flex items-center h-full">
              <LocalizedClientLink href="/" className="flex items-center">
                <CaliLeanLogo className="h-7" color="#1F2326" tracking="nav" />
              </LocalizedClientLink>
            </div>

            <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
              <div className="hidden small:flex items-center gap-x-6 h-full">
                {process.env.NEXT_PUBLIC_FEATURE_SEARCH_ENABLED && (
                  <LocalizedClientLink href="/search" className="font-medium text-bluum-text hover:opacity-70 transition-opacity">
                    Search
                  </LocalizedClientLink>
                )}
                <LocalizedClientLink href="/account" className="font-medium text-bluum-text hover:opacity-70 transition-opacity">
                  Account
                </LocalizedClientLink>
              </div>
              <Suspense
                fallback={
                  <LocalizedClientLink href="/cart" className="font-medium text-bluum-text hover:opacity-70 flex gap-2">
                    Cart (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </nav>
        </header>
      </div>
    </>
  )
}
