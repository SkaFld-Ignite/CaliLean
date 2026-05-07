import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Adjustments } from "@medusajs/icons"
import { Container, Heading, Text, Input, Button, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "../../../lib/sdk.js"

const SubscriptionSettingsPage = () => {
  const [discountRate, setDiscountRate] = useState<string>("")
  const [displayLabel, setDisplayLabel] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await sdk.client.fetch<{ config: { discount_rate: number; display_label: string } }>(
        "/admin/subscriptions/config"
      )
      setDiscountRate(String(Math.round(result.config.discount_rate * 1000) / 10))
      setDisplayLabel(result.config.display_label)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    const pct = parseFloat(discountRate)
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      toast.error("Enter a discount percentage between 0 and 100 (e.g. 11.5)")
      return
    }
    setIsSaving(true)
    try {
      await sdk.client.fetch("/admin/subscriptions/config", {
        method: "PUT",
        body: { discount_rate: pct / 100 },
      })
      toast.success("Subscription discount updated")
      await fetchConfig()
    } catch {
      toast.error("Failed to save — try again")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-6 max-w-lg">
        <div>
          <Heading level="h1">Subscription Settings</Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Configure the discount rate applied to all subscription orders. Changes take effect immediately on all storefront displays.
          </Text>
        </div>

        {isLoading ? (
          <span className="text-ui-fg-subtle text-sm">Loading…</span>
        ) : (
          <div className="flex flex-col gap-y-4 border border-ui-border-base rounded-lg p-5">
            <div className="flex flex-col gap-y-1.5">
              <label className="text-sm font-medium text-ui-fg-base">
                Discount Rate (%)
              </label>
              <Text className="text-xs text-ui-fg-subtle">
                Enter as a percentage, e.g. <strong>11.5</strong> for 11.5% off.
              </Text>
              <div className="flex items-center gap-x-2 mt-1">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="99.9"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                  className="w-32"
                />
                <span className="text-ui-fg-subtle text-sm">%</span>
              </div>
            </div>

            <div className="flex flex-col gap-y-1">
              <Text className="text-xs text-ui-fg-subtle">
                Current display label: <strong>{displayLabel}</strong>
              </Text>
              <Text className="text-xs text-ui-fg-muted">
                The label shown to customers (e.g. "11.5% off") is updated automatically.
              </Text>
            </div>

            <div className="mt-2">
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
                size="small"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}

        <div className="border border-ui-border-base rounded-lg p-4 bg-ui-bg-subtle">
          <Text className="text-xs text-ui-fg-subtle">
            <strong>Note:</strong> Changing this rate updates the display everywhere on the storefront (product page, cart, checkout, account, order confirmation). The actual Medusa promotion code <code>SUBSCRIBE_SAVE_15</code> controls the real discount applied at checkout — update that promotion in <strong>Promotions</strong> to match this display rate.
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscription Settings",
  icon: Adjustments,
})

export default SubscriptionSettingsPage
