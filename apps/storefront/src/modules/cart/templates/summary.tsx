"use client"

import { Button, Heading } from "@medusajs/ui"
import { CheckMini } from "@medusajs/icons"
import { useState } from "react"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import RUODisclaimer from "@modules/common/components/ruo-disclaimer"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { updateSubscriptionData, removeSubscriptionData } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  discountRate?: number
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

function SubscriptionBanner({ cart, discountRate = 0.115 }: { cart: HttpTypes.StoreCart; discountRate?: number }) {
  const isSubscribed = !!cart?.metadata?.subscription_interval
  const [loading, setLoading] = useState(false)

  const subtotal = cart?.subtotal ?? 0
  const discountedAmount = Math.round(subtotal * (1 - discountRate))
  const savings = subtotal - discountedAmount
  const discountPct = Math.round(discountRate * 1000) / 10

  const toggle = async () => {
    setLoading(true)
    try {
      if (isSubscribed) {
        await removeSubscriptionData()
      } else {
        await updateSubscriptionData()
      }
    } finally {
      setLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border border-calilean-ink rounded-btn bg-calilean-sand/10">
        <div className="flex items-center gap-x-2 text-calilean-ink">
          <CheckMini className="text-calilean-pacific flex-shrink-0" />
          <div className="flex flex-col gap-y-0.5">
            <span className="text-sm font-medium">
              Monthly Subscription — {discountPct}% off
            </span>
            {savings > 0 && (
              <span className="text-xs text-calilean-pacific font-medium">
                Saving ${(savings / 100).toFixed(2)} this order
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className="text-xs text-calilean-fog hover:text-calilean-ink transition-colors underline"
        >
          {loading ? "…" : "Remove"}
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border border-calilean-sand rounded-btn bg-white cursor-pointer hover:border-calilean-fog transition-colors"
      onClick={toggle}
    >
      <div className="flex flex-col gap-y-0.5">
        <span className="text-sm font-medium text-calilean-ink">
          Subscribe &amp; Save {discountPct}%
        </span>
        <span className="text-xs text-ui-fg-subtle">
          Renews monthly — cancel anytime
        </span>
      </div>
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
        {loading ? "…" : "Add"}
      </span>
    </div>
  )
}

const Summary = ({ cart, discountRate }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <SubscriptionBanner cart={cart} discountRate={discountRate} />
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} discountRate={discountRate} />
      <p className="text-xs text-calilean-fog text-center">
        By checking out you confirm this purchase is for research use only.
      </p>
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10">Go to checkout</Button>
      </LocalizedClientLink>
      <RUODisclaimer variant="inline" />
    </div>
  )
}

export default Summary
