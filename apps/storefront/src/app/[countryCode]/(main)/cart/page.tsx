import { Metadata } from "next"
import CartTemplate from "@modules/cart/templates"

import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { getSubscriptionConfig } from "@lib/data/subscriptions"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Cart() {
  const [cart, customer, { discount_rate }] = await Promise.all([
    fetchCart(),
    getCustomer(),
    getSubscriptionConfig(),
  ])

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      discountRate={discount_rate}
    />
  )
}
