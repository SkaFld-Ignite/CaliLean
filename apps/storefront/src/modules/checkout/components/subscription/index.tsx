"use client"

import { Button, clx, Heading, Text, RadioGroup, Badge } from "@medusajs/ui"
import { CheckCircleSolid, CheckMini } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import { updateSubscriptionData, removeSubscriptionData } from "@lib/data/cart"
import ErrorMessage from "@modules/checkout/components/error-message"
import { convertToLocale } from "@lib/util/money"

const SubscriptionForm = ({
  cart,
  discountRate = 0.115,
}: {
  cart: any
  discountRate?: number
}) => {
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">(
    cart?.metadata?.subscription_interval ? "subscription" : "one-time"
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "subscription"
  const hasData = !!cart?.metadata?.subscription_interval
  const addressReady = !!cart?.shipping_address?.address_1 && !!cart?.email

  const currencyCode = cart?.currency_code || "usd"
  const subtotal = cart?.subtotal ?? 0
  const discountedMonthly = Math.round(subtotal * (1 - discountRate))
  const discountPct = Math.round(discountRate * 1000) / 10

  // Sync state when cart changes externally
  useEffect(() => {
    if (cart?.metadata?.subscription_interval) {
      setPurchaseType("subscription")
    } else {
      setPurchaseType("one-time")
    }
  }, [cart])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "subscription"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (purchaseType === "subscription") {
        await updateSubscriptionData()
      } else {
        await removeSubscriptionData()
      }
      router.push(pathname + "?step=delivery", { scroll: false })
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border border-calilean-sand rounded-large p-6 sm:p-8">
      <div className="flex flex-row items-center justify-between mb-8">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-center text-calilean-ink",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !addressReady,
            }
          )}
        >
          Purchase Options
          {!isOpen && (hasData || purchaseType === "one-time") && (
            <CheckCircleSolid className="text-calilean-pacific" />
          )}
        </Heading>
        {!isOpen && addressReady && (
          <button
            onClick={handleEdit}
            className="text-calilean-pacific hover:text-calilean-ink transition-colors text-small-semi uppercase tracking-widest"
          >
            Edit
          </button>
        )}
      </div>

      <div className={isOpen ? "block" : "hidden"}>
        <RadioGroup
          value={purchaseType}
          onValueChange={(v: any) => setPurchaseType(v)}
          className="flex flex-col gap-y-3"
          aria-label="Purchase type"
        >
          {/* Subscribe option */}
          <div
            className={clx(
              "relative flex flex-col p-5 border rounded-btn cursor-pointer transition-all",
              purchaseType === "subscription"
                ? "border-calilean-ink bg-calilean-sand/10 ring-1 ring-calilean-ink"
                : "border-calilean-sand hover:border-calilean-fog bg-white"
            )}
            onClick={() => setPurchaseType("subscription")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setPurchaseType("subscription")
              }
            }}
            role="radio"
            aria-checked={purchaseType === "subscription"}
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-x-4">
              <div className="flex items-center gap-x-3 flex-1">
                <RadioGroup.Item value="subscription" id="subscription" />
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-center gap-x-2 flex-wrap">
                    <Text className="text-base-semi text-calilean-ink">
                      Subscribe Monthly &amp; Save
                    </Text>
                    <Badge
                      color="green"
                      size="small"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      {discountPct}% off
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-x-2">
                    <Text className="text-small-regular text-ui-fg-subtle line-through">
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: currencyCode,
                      })}
                    </Text>
                    <Text className="text-xl-semi text-calilean-ink">
                      {convertToLocale({
                        amount: discountedMonthly,
                        currency_code: currencyCode,
                      })}
                    </Text>
                    <Text className="text-small-regular text-ui-fg-subtle">
                      / month
                    </Text>
                  </div>
                  <Text className="text-xsmall-regular text-ui-fg-subtle">
                    Renews monthly — cancel anytime
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* One-time option */}
          <div
            className={clx(
              "relative flex flex-col p-5 border rounded-btn cursor-pointer transition-all",
              purchaseType === "one-time"
                ? "border-calilean-ink bg-calilean-sand/10 ring-1 ring-calilean-ink"
                : "border-calilean-sand hover:border-calilean-fog bg-white"
            )}
            onClick={() => setPurchaseType("one-time")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setPurchaseType("one-time")
              }
            }}
            role="radio"
            aria-checked={purchaseType === "one-time"}
            tabIndex={0}
          >
            <div className="flex items-start gap-x-3">
              <RadioGroup.Item value="one-time" id="one-time" />
              <div className="flex flex-col gap-y-1">
                <Text className="text-base-semi text-calilean-ink">
                  One-time purchase
                </Text>
                <div className="flex items-baseline gap-x-2">
                  <Text className="text-xl-semi text-calilean-ink">
                    {convertToLocale({
                      amount: subtotal,
                      currency_code: currencyCode,
                    })}
                  </Text>
                </div>
                <Text className="text-xsmall-regular text-ui-fg-subtle">
                  No commitment — purchase once
                </Text>
              </div>
            </div>
          </div>
        </RadioGroup>

        {purchaseType === "subscription" && (
          <div className="mt-4 flex flex-col gap-y-2 px-1">
            <div className="flex items-center gap-x-2 text-calilean-pacific">
              <CheckMini />
              <Text className="text-small-regular">
                Free Priority Shipping on every order
              </Text>
            </div>
            <div className="flex items-center gap-x-2 text-calilean-pacific">
              <CheckMini />
              <Text className="text-small-regular">
                Batch-locked Certificates of Analysis
              </Text>
            </div>
          </div>
        )}

        <ErrorMessage error={error} />

        <Button
          size="large"
          onClick={handleSubmit}
          isLoading={isLoading}
          className="bg-calilean-ink hover:bg-calilean-ink/90 text-white w-full sm:w-fit min-w-[200px] mt-6"
        >
          Continue to delivery
        </Button>
      </div>

      {/* Collapsed summary */}
      {!isOpen && (
        <div
          className={clx(
            "transition-all duration-300",
            hasData || purchaseType === "one-time" ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="bg-calilean-sand/20 p-4 rounded-btn border border-calilean-sand border-dashed">
            <div className="flex items-center justify-between">
              <Text className="text-base-semi text-calilean-ink">
                {cart?.metadata?.subscription_interval
                  ? "Monthly Subscription – 11.5% off"
                  : "One-time Purchase"}
              </Text>
              {cart?.metadata?.subscription_interval && (
                <Text className="text-small-regular text-ui-fg-subtle">
                  Cancel anytime
                </Text>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionForm
