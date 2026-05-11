"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { clx } from "@medusajs/ui"

const ViewToggle = ({ active }: { active: "pathway" | "all" }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams)
    if (view === "pathway") {
      params.delete("view")
      params.delete("sortBy")
      params.delete("page")
    } else {
      params.set("view", view)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    })
  }

  return (
    <div className="inline-flex border border-calilean-sand rounded-btn overflow-hidden text-sm">
      <button
        onClick={() => setView("pathway")}
        className={clx(
          "px-4 py-2 transition-colors",
          active === "pathway"
            ? "bg-calilean-ink text-calilean-bg"
            : "bg-calilean-bg text-calilean-fog hover:text-calilean-ink"
        )}
      >
        By Pathway
      </button>
      <button
        onClick={() => setView("all")}
        className={clx(
          "px-4 py-2 transition-colors",
          active === "all"
            ? "bg-calilean-ink text-calilean-bg"
            : "bg-calilean-bg text-calilean-fog hover:text-calilean-ink"
        )}
      >
        All Products
      </button>
    </div>
  )
}

export default ViewToggle
