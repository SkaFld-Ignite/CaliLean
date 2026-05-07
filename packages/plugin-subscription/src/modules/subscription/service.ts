import { MedusaService } from "@medusajs/framework/utils"
import Subscription from "./models/subscription";
import SubscriptionConfig from "./models/subscription-config";
import {
  CreateSubscriptionData,
  SubscriptionData,
  SubscriptionInterval,
  SubscriptionStatus
} from "./types";
import moment from "moment";

class SubscriptionModuleService extends MedusaService({
  Subscription,
  SubscriptionConfig,
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
    const nextOrderDate = moment(last_order_date)
      .add(
        increment,
        interval === SubscriptionInterval.MONTHLY ?
          "month" : "year"
      )
    const expirationMomentDate = moment(expiration_date)

    // if next order date is after the expiration date, return
    // null. Otherwise, return the next order date.
    return nextOrderDate.isAfter(expirationMomentDate) ?
      null : nextOrderDate.toDate()
  }

  async getSubscriptionConfig(): Promise<{ id: string; discount_rate: number; display_label: string }> {
    const results = await this.listSubscriptionConfigs({ id: "default" })
    if (results.length > 0) return results[0] as any
    // seed default row if missing
    await this.createSubscriptionConfigs({ id: "default", discount_rate: 0.115, display_label: "11.5%" } as any)
    return { id: "default", discount_rate: 0.115, display_label: "11.5%" }
  }

  async updateSubscriptionConfig(discount_rate: number): Promise<{ id: string; discount_rate: number; display_label: string }> {
    const pct = Math.round(discount_rate * 1000) / 10
    const display_label = `${pct}%`
    const results = await this.listSubscriptionConfigs({ id: "default" })
    if (results.length === 0) {
      await this.createSubscriptionConfigs({ id: "default", discount_rate, display_label } as any)
    } else {
      await this.updateSubscriptionConfigs({ selector: { id: "default" }, data: { discount_rate, display_label } })
    }
    return { id: "default", discount_rate, display_label }
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
      return moment(subscription_date).add(100, "year").toDate()
    }
    return moment(subscription_date)
      .add(
        period,
        interval === SubscriptionInterval.MONTHLY ?
          "month" : "year"
      ).toDate()
  }
}

export default SubscriptionModuleService