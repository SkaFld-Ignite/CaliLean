"use client"

import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"

import MobileActions from "./mobile-actions"
import OptionSelect from "./option-select"
import ProductPrice from "../product-price"
import QuantitySelector from "../quantity-selector"
import SubscriptionOffer from "../subscription-offer"
import {
  addToCart,
  updateSubscriptionData,
  removeSubscriptionData,
} from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  discountRate?: number
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce(
    (acc: Record<string, string | undefined>, varopt: any) => {
      if (
        varopt.option &&
        varopt.value !== null &&
        varopt.value !== undefined
      ) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    },
    {}
  )
}

export default function ProductActions({
  product,
  region,
  disabled,
  discountRate,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscribe">(
    "one-time"
  )
  const countryCode = useParams().countryCode as string

  // Preselect the first variant on mount
  useEffect(() => {
    const first = product.variants?.[0]
    if (first && Object.keys(options).length === 0) {
      const variantOptions = optionsAsKeymap(first.options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const updateOptions = (title: string, value: string) => {
    setOptions((prev) => ({ ...prev, [title]: value }))
  }

  const hasMultipleVariants = (product.variants?.length ?? 0) > 1

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }
    if (selectedVariant?.allow_backorder) {
      return true
    }
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    if (purchaseType === "subscribe") {
      await updateSubscriptionData()
    } else {
      await removeSubscriptionData()
    }

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-4" ref={actionsRef}>
        {hasMultipleVariants && (
          <div className="flex flex-col gap-y-4">
            {(product.options || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.title ?? ""]}
                updateOption={updateOptions}
                title={option.title ?? ""}
                disabled={!!disabled || isAdding}
                data-testid="product-options"
              />
            ))}
          </div>
        )}
        <ProductPrice product={product} variant={selectedVariant} />

        <QuantitySelector
          quantity={quantity}
          onChange={setQuantity}
          disabled={!!disabled || isAdding}
        />

        <SubscriptionOffer
          product={product}
          variant={selectedVariant}
          selected={purchaseType}
          onSelect={setPurchaseType}
          discountRate={discountRate}
        />

        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding}
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : purchaseType === "subscribe"
            ? quantity > 1
              ? `Subscribe — Add ${quantity}`
              : "Subscribe & Add to Cart"
            : quantity > 1
            ? `Add ${quantity} to cart`
            : "Add to cart"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
        />
      </div>
    </>
  )
}
