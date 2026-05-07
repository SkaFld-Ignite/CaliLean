"use client"

import { convertToLocale } from "@lib/util/money"
import { Text } from "@medusajs/ui"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    shipping_total?: number | null
    discount_total?: number | null
    gift_card_total?: number | null
    currency_code: string
    promotions?: any[]
    items?: any[]
    metadata?: any
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    subtotal,
    tax_total,
    shipping_total,
    gift_card_total,
    promotions,
    items,
    metadata,
  } = totals

  const subscriptionInterval = metadata?.subscription_interval

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle">
        <div className="flex items-center justify-between">
          <span className="text-calilean-ink font-medium">Subtotal</span>
          <span
            data-testid="cart-subtotal"
            data-value={subtotal || 0}
            className="text-calilean-ink"
          >
            {convertToLocale({ amount: subtotal ?? 0, currency_code })}
          </span>
        </div>

        {(promotions ?? []).map((promo: any) => {
          const promoAmount = (items ?? []).reduce((acc: number, item: any) => {
            return (
              acc +
              (item.adjustments || [])
                .filter((a: any) => a.promotion_id === promo.id)
                .reduce((sum: number, adj: any) => sum + adj.amount, 0)
            )
          }, 0)

          const label =
            promo.code === "SUBSCRIBE_SAVE_15"
              ? "Subscription Savings (11.5%)"
              : `Promo: ${promo.code}`

          return (
            <div key={promo.id} className="flex items-center justify-between">
              <span className="flex items-center gap-x-1 italic">{label}</span>
              <span className="text-calilean-pacific font-medium">
                - {convertToLocale({ amount: promoAmount, currency_code })}
              </span>
            </div>
          )
        })}

        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={shipping_total || 0}>
            {convertToLocale({ amount: shipping_total ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
        {!!gift_card_total && (
          <div className="flex items-center justify-between">
            <span>Gift card</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-gift-card-amount"
              data-value={gift_card_total || 0}
            >
              -{" "}
              {convertToLocale({ amount: gift_card_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>

      <div className="h-px w-full border-b border-calilean-sand my-4" />

      <div className="flex items-center justify-between text-calilean-ink mb-2">
        <Text className="text-xl-semi">Today&apos;s Charge</Text>
        <span
          className="text-xl-semi"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>

      {subscriptionInterval && (
        <div className="mt-4 p-3 bg-calilean-sand/30 rounded-btn border border-calilean-sand">
          <div className="flex items-center justify-between">
            <Text className="text-small-regular text-calilean-ink font-medium">
              Monthly Subscription — 11.5% off every order
            </Text>
          </div>
          <Text className="text-[10px] text-ui-fg-subtle leading-tight italic mt-1">
            Renews monthly. Cancel anytime.
          </Text>
        </div>
      )}

      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
