"use server"

import "server-only"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export type SubscriptionData = {
  id: string
  status: "active" | "canceled" | "expired" | "failed"
  interval: "monthly" | "yearly"
  period: number
  subscription_date: string
  last_order_date: string
  next_order_date: string | null
  expiration_date: string
  metadata: Record<string, unknown> | null
  orders?: Array<{ id: string; created_at: string }>
  customer?: { id: string; email: string }
}

export async function listSubscriptions(): Promise<SubscriptionData[]> {
  try {
    const resp = await sdk.client.fetch<{
      subscriptions: SubscriptionData[]
    }>("/store/customers/me/subscriptions", {
      method: "GET",
      headers: await getAuthHeaders(),
    })
    return resp.subscriptions || []
  } catch {
    return []
  }
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  await sdk.client.fetch(
    `/store/customers/me/subscriptions/${subscriptionId}`,
    {
      method: "POST",
      headers: await getAuthHeaders(),
    }
  )
}
