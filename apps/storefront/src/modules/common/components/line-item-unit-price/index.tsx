import { getPercentageDiff } from "@lib/util/get-percentage-diff"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
}

const LineItemUnitPrice = ({
  item,
  style = "default",
}: LineItemUnitPriceProps) => {
  const { original_price_number, currency_code } =
    getPricesForVariant(item.variant) ?? {}

  // Use the cart line item's unit_price which reflects quantity-based pricing
  const unitPrice = item.unit_price
  const originalPriceNum = original_price_number ?? unitPrice
  const hasReducedPrice = unitPrice < originalPriceNum

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-ui-fg-muted">Original: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({ amount: originalPriceNum, currency_code })}
            </span>
          </p>
          {style === "default" && (
            <span className="text-ui-fg-interactive">
              -{getPercentageDiff(originalPriceNum, unitPrice)}%
            </span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({ amount: unitPrice, currency_code })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
