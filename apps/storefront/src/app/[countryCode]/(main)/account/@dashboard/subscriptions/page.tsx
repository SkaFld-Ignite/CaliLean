import { Metadata } from "next"
import {
  listSubscriptions,
  getSubscriptionConfig,
} from "@lib/data/subscriptions"
import SubscriptionOverview from "@modules/account/components/subscription-overview"

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your active subscriptions.",
}

export default async function Subscriptions() {
  const [subscriptions, { discount_rate }] = await Promise.all([
    listSubscriptions(),
    getSubscriptionConfig(),
  ])

  return (
    <div className="w-full" data-testid="subscriptions-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Subscriptions</h1>
        <p className="text-base-regular">
          View and manage your active subscriptions. You can cancel a
          subscription at any time.
        </p>
      </div>
      <div>
        <SubscriptionOverview
          subscriptions={subscriptions}
          discountRate={discount_rate}
        />
      </div>
    </div>
  )
}
