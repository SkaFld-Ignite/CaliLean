"use client"

import { Button, Badge } from "@medusajs/ui"
import { CheckMini } from "@medusajs/icons"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SubscriptionData, cancelSubscription } from "@lib/data/subscriptions"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  canceled: "orange",
  expired: "grey",
  failed: "red",
}

const SubscriptionOverview = ({
  subscriptions,
}: {
  subscriptions: SubscriptionData[]
}) => {
  if (!subscriptions?.length) {
    return (
      <div
        className="w-full flex flex-col items-center gap-y-4"
        data-testid="no-subscriptions-container"
      >
        <h2 className="text-large-semi">No subscriptions</h2>
        <p className="text-base-regular">
          You don&apos;t have any active subscriptions yet.
        </p>
        <div className="mt-4">
          <LocalizedClientLink href="/" passHref>
            <Button>Continue shopping</Button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-6 w-full">
      {subscriptions.map((sub) => (
        <SubscriptionCard key={sub.id} subscription={sub} />
      ))}
    </div>
  )
}

const SubscriptionCard = ({
  subscription,
}: {
  subscription: SubscriptionData
}) => {
  const [canceling, setCanceling] = useState(false)
  const [status, setStatus] = useState(subscription.status)

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return
    setCanceling(true)
    try {
      await cancelSubscription(subscription.id)
      setStatus("canceled")
    } catch (err: any) {
      alert(err.message || "Failed to cancel subscription")
    } finally {
      setCanceling(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-x-3 flex-wrap gap-y-2">
          <h3 className="text-base-semi">
            Subscription #{subscription.id.slice(-8)}
          </h3>
          <Badge color={statusColors[status] || "grey"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {status === "active" && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
              11.5% off every order
            </span>
          )}
        </div>
        {status === "active" && (
          <Button
            variant="danger"
            size="small"
            onClick={handleCancel}
            isLoading={canceling}
            disabled={canceling}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Active subscription perks */}
      {status === "active" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-btn flex flex-col gap-y-1.5">
          <div className="flex items-center gap-x-2 text-green-700">
            <CheckMini />
            <span className="text-xs font-medium">
              11.5% discount applied to every renewal order
            </span>
          </div>
          <div className="flex items-center gap-x-2 text-green-700">
            <CheckMini />
            <span className="text-xs">
              Free Priority Shipping on every order
            </span>
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-ui-fg-subtle">Interval</span>
          <p className="text-ui-fg-base font-medium">
            {subscription.interval === "monthly" ? "Monthly" : "Yearly"}
            {" · "}
            {subscription.period === 0
              ? "Cancel anytime"
              : `${subscription.period} ${
                  subscription.interval === "monthly" ? "month" : "year"
                }${subscription.period > 1 ? "s" : ""}`}
          </p>
        </div>
        <div>
          <span className="text-ui-fg-subtle">Started</span>
          <p className="text-ui-fg-base font-medium">
            {formatDate(subscription.subscription_date)}
          </p>
        </div>
        <div>
          <span className="text-ui-fg-subtle">Next order</span>
          <p className="text-ui-fg-base font-medium">
            {subscription.next_order_date
              ? formatDate(subscription.next_order_date)
              : "N/A"}
          </p>
        </div>
        <div>
          <span className="text-ui-fg-subtle">Expires</span>
          <p className="text-ui-fg-base font-medium">
            {subscription.period === 0
              ? "Never (cancel anytime)"
              : formatDate(subscription.expiration_date)}
          </p>
        </div>
      </div>

      {subscription.orders && subscription.orders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-ui-fg-subtle">
            {subscription.orders.length} order
            {subscription.orders.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  )
}

export default SubscriptionOverview
