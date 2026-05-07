"use server"

import "server-only"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { unstable_cache } from "next/cache"

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

export type SubscriptionConfig = {
  discount_rate: number
  display_label: string
}

const DEFAULT_CONFIG: SubscriptionConfig = {
  discount_rate: 0.115,
  display_label: "11.5%",
}

export const getSubscriptionConfig = unstable_cache(
  async (): Promise<SubscriptionConfig> => {
    try {
      const resp = await sdk.client.fetch<{ config: SubscriptionConfig }>(
        "/store/subscriptions/config"
      )
      return resp.config ?? DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  },
  ["subscription-config"],
  { revalidate: 300 }
)

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
