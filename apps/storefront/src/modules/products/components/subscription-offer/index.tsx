"use client"

import { clx } from "@medusajs/ui"
import { CheckMini } from "@medusajs/icons"
import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type SubscriptionOfferProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  selected: "one-time" | "subscribe"
  onSelect: (value: "one-time" | "subscribe") => void
  discountRate?: number
}

export default function SubscriptionOffer({
  product,
  variant,
  selected,
  onSelect,
  discountRate = 0.115,
}: SubscriptionOfferProps) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })
  const price = variant ? variantPrice : cheapestPrice

  if (!price) return null

  const baseAmount = price.calculated_price_number
  const currencyCode = price.currency_code
  const discountedAmount = Math.round(baseAmount * (1 - discountRate))

  const originalFormatted = convertToLocale({
    amount: baseAmount,
    currency_code: currencyCode,
  })
  const discountedFormatted = convertToLocale({
    amount: discountedAmount,
    currency_code: currencyCode,
  })

  return (
    <div
      className="flex flex-col gap-y-2"
      role="radiogroup"
      aria-label="Purchase type"
    >
      {/* One-time */}
      <div
        className={clx(
          "flex items-center gap-x-3 px-4 py-3 border rounded-btn cursor-pointer transition-all",
          selected === "one-time"
            ? "border-calilean-ink bg-calilean-sand/10 ring-1 ring-calilean-ink"
            : "border-calilean-sand hover:border-calilean-fog bg-white"
        )}
        onClick={() => onSelect("one-time")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect("one-time")
          }
        }}
        role="radio"
        aria-checked={selected === "one-time"}
        tabIndex={0}
      >
        <div
          className={clx(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
            selected === "one-time"
              ? "border-calilean-ink"
              : "border-calilean-fog"
          )}
        >
          {selected === "one-time" && (
            <div className="w-2 h-2 rounded-full bg-calilean-ink" />
          )}
        </div>
        <div className="flex flex-col gap-y-0.5 flex-1">
          <span className="text-sm font-medium text-calilean-ink">
            One-time purchase
          </span>
          <span className="text-base font-semibold text-calilean-ink tabular-nums">
            {originalFormatted}
          </span>
        </div>
      </div>

      {/* Subscribe & Save */}
      <div
        className={clx(
          "flex flex-col px-4 py-3 border rounded-btn cursor-pointer transition-all",
          selected === "subscribe"
            ? "border-calilean-ink bg-calilean-sand/10 ring-1 ring-calilean-ink"
            : "border-calilean-sand hover:border-calilean-fog bg-white"
        )}
        onClick={() => onSelect("subscribe")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect("subscribe")
          }
        }}
        role="radio"
        aria-checked={selected === "subscribe"}
        tabIndex={0}
      >
        <div className="flex items-center gap-x-3">
          <div
            className={clx(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              selected === "subscribe"
                ? "border-calilean-ink"
                : "border-calilean-fog"
            )}
          >
            {selected === "subscribe" && (
              <div className="w-2 h-2 rounded-full bg-calilean-ink" />
            )}
          </div>
          <div className="flex flex-col gap-y-0.5 flex-1">
            <div className="flex items-center gap-x-2 flex-wrap">
              <span className="text-sm font-medium text-calilean-ink">
                Subscribe &amp; Save
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                {Math.round(discountRate * 1000) / 10}% off
              </span>
            </div>
            <div className="flex items-baseline gap-x-2">
              <span className="text-base font-semibold text-calilean-ink tabular-nums">
                {discountedFormatted}
              </span>
              <span className="text-sm text-ui-fg-subtle line-through tabular-nums">
                {originalFormatted}
              </span>
              <span className="text-xs text-ui-fg-subtle">/ month</span>
            </div>
          </div>
        </div>

        {selected === "subscribe" && (
          <div className="mt-3 flex flex-col gap-y-1.5 pl-7">
            <div className="flex items-center gap-x-2 text-calilean-pacific">
              <CheckMini />
              <span className="text-xs">
                Free Priority Shipping on every order
              </span>
            </div>
            <div className="flex items-center gap-x-2 text-calilean-pacific">
              <CheckMini />
              <span className="text-xs">Cancel anytime</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
