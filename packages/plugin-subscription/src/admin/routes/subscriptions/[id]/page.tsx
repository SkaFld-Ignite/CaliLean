import {
  Container,
  Heading,
  Badge,
  Table,
  Text,
} from "@medusajs/ui"
import { CheckMini } from "@medusajs/icons"
import { useParams, Link } from "react-router-dom"
import { SubscriptionData, SubscriptionStatus } from "../../../types/index.js"
import { sdk } from "../../../lib/sdk.js"
import { useCallback, useEffect, useState } from "react"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  [SubscriptionStatus.ACTIVE]: "green",
  [SubscriptionStatus.CANCELED]: "orange",
  [SubscriptionStatus.EXPIRED]: "grey",
  [SubscriptionStatus.FAILED]: "red",
}

const SubscriptionPage = () => {
  const { id } = useParams()
  const [data, setData] = useState<{ subscription: SubscriptionData } | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await sdk.client.fetch(`/admin/subscriptions/${id}`)
      setData(result as { subscription: SubscriptionData })
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const sub = data?.subscription

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  return (
    <Container>
      {isLoading && <span>Loading…</span>}

      {sub && (
        <div className="flex flex-col gap-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Heading level="h1">
                Subscription #{sub.id.slice(-8)}
              </Heading>
              <Badge color={statusColors[sub.status] || "grey"}>
                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
              </Badge>
              {sub.status === SubscriptionStatus.ACTIVE && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                  11.5% off
                </span>
              )}
            </div>
          </div>

          {/* Discount info */}
          {sub.status === SubscriptionStatus.ACTIVE && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-y-1.5">
              <Text className="text-sm font-semibold text-green-800">
                Subscription Benefits
              </Text>
              <div className="flex items-center gap-x-2 text-green-700">
                <CheckMini />
                <span className="text-sm">11.5% discount on every renewal order</span>
              </div>
              <div className="flex items-center gap-x-2 text-green-700">
                <CheckMini />
                <span className="text-sm">Free Priority Shipping</span>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm border border-gray-200 rounded-lg p-4">
            <div>
              <span className="text-ui-fg-subtle text-xs uppercase tracking-wide">Customer</span>
              <p className="font-medium mt-0.5">{sub.customer?.email || "—"}</p>
            </div>
            <div>
              <span className="text-ui-fg-subtle text-xs uppercase tracking-wide">Interval</span>
              <p className="font-medium mt-0.5">
                {sub.interval === "monthly" ? "Monthly" : "Yearly"}
                {sub.period === 0 ? " · Cancel anytime" : ` · ${sub.period} periods`}
              </p>
            </div>
            <div>
              <span className="text-ui-fg-subtle text-xs uppercase tracking-wide">Started</span>
              <p className="font-medium mt-0.5">{formatDate(sub.subscription_date)}</p>
            </div>
            <div>
              <span className="text-ui-fg-subtle text-xs uppercase tracking-wide">Next Order</span>
              <p className="font-medium mt-0.5">
                {sub.next_order_date ? formatDate(sub.next_order_date) : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-ui-fg-subtle text-xs uppercase tracking-wide">Last Order</span>
              <p className="font-medium mt-0.5">{formatDate(sub.last_order_date)}</p>
            </div>
            <div>
              <span className="text-ui-fg-subtle text-xs uppercase tracking-wide">Expires</span>
              <p className="font-medium mt-0.5">
                {sub.period === 0 ? "Never" : formatDate(sub.expiration_date)}
              </p>
            </div>
          </div>

          {/* Orders */}
          <div>
            <Heading level="h2" className="mb-3">Orders</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order ID</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(sub.orders ?? []).map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell className="font-mono text-xs">{order.id}</Table.Cell>
                    <Table.Cell>{new Date(order.created_at).toDateString()}</Table.Cell>
                    <Table.Cell>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Order
                      </Link>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {(!sub.orders || sub.orders.length === 0) && (
                  <Table.Row>
                    <Table.Cell colSpan={3} className="text-center text-ui-fg-subtle py-4">
                      No orders yet
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
        </div>
      )}
    </Container>
  )
}

export default SubscriptionPage
