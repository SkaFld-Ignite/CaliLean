import { Metadata } from "next"
import { redirect } from "next/navigation"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "The Lineup | CaliLean",
  description:
    "Research-grade compounds across recovery, metabolic, longevity, and cosmetic pathways. Every vial batch-tested.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    view?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage({ searchParams, params }: Params) {
  const { sortBy, page, view } = await searchParams
  const { countryCode } = await params
  const activeView = view === "all" ? "all" : "pathway"

  if (activeView === "pathway" && (sortBy || page)) {
    redirect(`/${countryCode}/store`)
  }

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
      view={view}
    />
  )
}
