"use server"

import "server-only"
import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { omit } from "lodash"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { getProductsById } from "./products"
import { getRegion } from "./regions"
import {
  RUO_ATTESTATION_LABEL,
  RUO_ATTESTATION_VERSION,
  getGeoDenyMessage,
  isUsStateAllowed,
  normalizeUsStateCode,
} from "@lib/ruo"

export async function retrieveCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return null
  }

  return await sdk.store.cart
    .retrieve(
      cartId,
      {},
      { next: { tags: ["cart"] }, ...(await getAuthHeaders()) }
    )
    .then(({ cart }) => cart)
    .catch(() => {
      return null
    })
}

export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (!cart || cart.completed_at) {
    if (cart?.completed_at) {
      await removeCartId()
    }
    const cartResp = await sdk.store.cart.create({ region_id: region.id })
    cart = cartResp.cart
    await setCartId(cart.id)
    // Attach QR attribution if present
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const attributionCookie = cookieStore.get("__cl_attribution")
    if (attributionCookie?.value) {
      try {
        const attribution = JSON.parse(attributionCookie.value)
        await sdk.store.cart.update(
          cart.id,
          { metadata: { attribution } },
          {},
          await getAuthHeaders()
        )
      } catch {
        // Invalid cookie — skip
      }
    }
    revalidateTag("cart")
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(
      cart.id,
      { region_id: region.id },
      {},
      await getAuthHeaders()
    )
    revalidateTag("cart")
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  return sdk.store.cart
    .update(cartId, data, {}, await getAuthHeaders())
    .then(({ cart }) => {
      revalidateTag("cart")
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)
  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      await getAuthHeaders()
    )
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, await getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, await getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function enrichLineItems(
  lineItems:
    | HttpTypes.StoreCartLineItem[]
    | HttpTypes.StoreOrderLineItem[]
    | null,
  regionId: string
) {
  if (!lineItems) return []

  // Prepare query parameters
  const queryParams = {
    ids: lineItems.map((lineItem) => lineItem.product_id!),
    regionId: regionId,
  }

  // Fetch products by their IDs
  const products = await getProductsById(queryParams)
  // If there are no line items or products, return an empty array
  if (!lineItems?.length || !products) {
    return []
  }

  // Enrich line items with product and variant information
  const enrichedItems = lineItems.map((item) => {
    const product = products.find((p) => p.id === item.product_id)
    const variant = product?.variants?.find(
      (v) => v.id === item.variant_id
    )

    // If product or variant is not found, return the original item
    if (!product || !variant) {
      return item
    }

    // If product and variant are found, enrich the item
    return {
      ...item,
      variant: {
        ...variant,
        product: omit(product, "variants"),
      },
    }
  }) as HttpTypes.StoreCartLineItem[]

  return enrichedItems
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  return sdk.store.cart
    .addShippingMethod(
      cartId,
      { option_id: shippingMethodId },
      {},
      await getAuthHeaders()
    )
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
    data?: Record<string, unknown>
  }
) {
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, await getAuthHeaders())
    .then((resp) => {
      revalidateTag("cart")
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found")
  }

  await updateCart({ promo_codes: codes }).catch(medusaError)
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: unknown) {
    if (e instanceof Error) return e.message
    return String(e)
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as HttpTypes.StoreUpdateCart

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }

    const shippingProvince = String(data.shipping_address.province ?? "")
    const shippingCountry = String(data.shipping_address.country_code ?? "")
    if (!isUsStateAllowed(shippingProvince, shippingCountry)) {
      // Structured rejection log so ops can measure suppression cost
      // (no PII — only the state code and a short cart-id prefix).
      console.warn(
        JSON.stringify({
          event: "ruo.geo.checkout_rejected",
          state: normalizeUsStateCode(shippingProvince),
          cart_id_prefix: cartId.slice(0, 8),
          ts: new Date().toISOString(),
        })
      )
      return getGeoDenyMessage(shippingProvince)
    }

    await updateCart(data)
  } catch (e: unknown) {
    if (e instanceof Error) return e.message
    return String(e)
  }

  return null
}

export async function updateSubscriptionData() {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found when setting subscription data")
  }

  await updateCart({
    metadata: {
      subscription_interval: "monthly",
      subscription_period: 0,
    },
  })

  // Apply subscription discount
  await sdk.client.fetch(`/store/carts/${cartId}/subscription-discount`, {
    method: "POST",
    body: { action: "add" },
    headers: await getAuthHeaders(),
  })

  revalidateTag("cart")
}

export async function removeSubscriptionData() {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found when removing subscription data")
  }

  // Clear metadata in Medusa 2.0
  await updateCart({
    metadata: {
      subscription_interval: null,
      subscription_period: null,
    },
  })

  // Remove subscription discount
  await sdk.client.fetch(`/store/carts/${cartId}/subscription-discount`, {
    method: "POST",
    body: { action: "remove" },
    headers: await getAuthHeaders(),
  })

  revalidateTag("cart")
}

export async function placeOrder() {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found when placing an order")
  }

  // Check if this cart has subscription metadata
  const cart = await retrieveCart()
  const isSubscription = !!cart?.metadata?.subscription_interval

  type CartCompletionResult = {
    type: "cart" | "order"
    cart?: HttpTypes.StoreCart
    order?: HttpTypes.StoreOrder
  }

  let cartRes: CartCompletionResult

  if (isSubscription) {
    // Use the custom subscribe endpoint for subscription orders
    cartRes = await sdk.client.fetch<CartCompletionResult>(`/store/carts/${cartId}/subscribe`, {
      method: "POST",
      headers: await getAuthHeaders(),
    })
    revalidateTag("cart")
  } else {
    cartRes = await sdk.store.cart
      .complete(cartId, {}, await getAuthHeaders())
      .then((cartRes) => {
        revalidateTag("cart")
        return cartRes
      })
      .catch(medusaError)
  }

  if (cartRes?.type === "order") {
    const order = cartRes.order!
    const countryCode =
      order.shipping_address?.country_code?.toLowerCase()
    await removeCartId()
    redirect(`/${countryCode}/order/confirmed/${order.id}`)
  }

  return cartRes.cart
}

export async function setRuoAttestation(agreed: boolean) {
  const ruo_attestation = agreed
    ? {
        agreed: true,
        version: RUO_ATTESTATION_VERSION,
        label: RUO_ATTESTATION_LABEL,
        agreed_at: new Date().toISOString(),
      }
    : null

  return updateCart({ metadata: { ruo_attestation } })
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    revalidateTag("cart")
  }

  revalidateTag("regions")
  revalidateTag("products")

  redirect(`/${countryCode}${currentPath}`)
}
