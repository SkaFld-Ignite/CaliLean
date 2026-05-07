import { MedusaService } from "@medusajs/framework/utils"
import Subscription from "./models/subscription";
import {
  CreateSubscriptionData,
  SubscriptionData,
  SubscriptionInterval,
  SubscriptionStatus
} from "./types";
import { addMonths, addYears, isAfter } from "date-fns";

class SubscriptionModuleService extends MedusaService({
  Subscription
}) {
  // @ts-expect-error
  async createSubscriptions(
    data: CreateSubscriptionData | CreateSubscriptionData[]
  ): Promise<SubscriptionData[]> {
    const input = Array.isArray(data) ? data : [data]

    const subscriptions = await Promise.all(
      input.map(async (subscription) => {
        const subscriptionDate = subscription.subscription_date || new Date()
        const expirationDate = this.getExpirationDate({
          subscription_date: subscriptionDate,
          interval: subscription.interval,
          period: subscription.period
        })

        return await super.createSubscriptions({
          ...subscription,
          subscription_date: subscriptionDate,
          last_order_date: subscriptionDate,
          next_order_date: this.getNextOrderDate({
            last_order_date: subscriptionDate,
            expiration_date: expirationDate,
            interval: subscription.interval,
            period: subscription.period
          }),
          expiration_date: expirationDate
        })
      })
    )

    return subscriptions
  }

  async recordNewSubscriptionOrder(id: string) {
    const subscription = await this.retrieveSubscription(id)

    const orderDate = new Date()

    return await this.updateSubscriptions({
      id,
      last_order_date: orderDate,
      next_order_date: this.getNextOrderDate({
        last_order_date: orderDate,
        expiration_date: subscription.expiration_date,
        interval: subscription.interval,
        period: subscription.period
      })
    })
  }

  async expireSubscription(id: string | string[]): Promise<SubscriptionData[]> {
    const input = Array.isArray(id) ? id : [id]

    return await this.updateSubscriptions({
      selector: {
        id: input
      },
      data: {
        next_order_date: null,
        status: SubscriptionStatus.EXPIRED
      }
    })
  }

  async cancelSubscriptions(
    id: string | string[]): Promise<SubscriptionData[]> {
    const input = Array.isArray(id) ? id : [id]

    return await this.updateSubscriptions({
      selector: {
        id: input
      },
      data: {
        next_order_date: null,
        status: SubscriptionStatus.CANCELED
      }
    })
  }

  getNextOrderDate({
    last_order_date,
    expiration_date,
    interval,
    period
  }: {
    last_order_date: Date
    expiration_date: Date
    interval: SubscriptionInterval,
    period: number
  }): Date | null {
    // period=0 means indefinite — always advance by 1 month
    const increment = period === 0 ? 1 : period
    const addFn = interval === SubscriptionInterval.MONTHLY ? addMonths : addYears
    const nextOrderDate = addFn(last_order_date, increment)

    // if next order date is after the expiration date, return
    // null. Otherwise, return the next order date.
    return isAfter(nextOrderDate, expiration_date) ?
      null : nextOrderDate
  }

  getExpirationDate({
    subscription_date,
    interval,
    period
  }: {
    subscription_date: Date,
    interval: SubscriptionInterval,
    period: number
  }) {
    // period=0 means indefinite — set expiration 100 years out
    if (period === 0) {
      return addYears(subscription_date, 100)
    }
    const addFn = interval === SubscriptionInterval.MONTHLY ? addMonths : addYears
    return addFn(subscription_date, period)
  }
}

export default SubscriptionModuleService