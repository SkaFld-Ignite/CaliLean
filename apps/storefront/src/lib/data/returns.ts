"use server"

import "server-only"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"

export const listReturnReasons = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreReturnReasonListResponse>(`/store/return-reasons`, {
      method: "GET",
      headers,
      cache: "force-cache",
    })
    .then(({ return_reasons }) => return_reasons)
    .catch((err) => medusaError(err))
}

export const listReturnShippingOptions = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
          is_return: true,
        },
        headers,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch((err) => medusaError(err))
}

export const calculateReturnShippingPrice = async (
  optionId: string,
  cartId: string
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body: { cart_id: cartId },
        headers,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch(() => null)
}

export const createReturnRequest = async (
  state: {
    success: boolean
    error: string | null
    return: HttpTypes.StoreReturn | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  return: HttpTypes.StoreReturn | null
}> => {
  const orderId = formData.get("order_id") as string
  const items = JSON.parse(formData.get("items") as string)
  const returnShippingOptionId = formData.get(
    "return_shipping_option_id"
  ) as string
  const locationId = formData.get("location_id") as string

  if (!orderId || !items || !returnShippingOptionId) {
    return {
      success: false,
      error: "Order ID, items, and return shipping option are required",
      return: null,
    }
  }

  const headers = await getAuthHeaders()

  return await sdk.client
    .fetch<HttpTypes.StoreReturnResponse>(`/store/returns`, {
      method: "POST",
      body: {
        order_id: orderId,
        items,
        return_shipping: {
          option_id: returnShippingOptionId,
        },
        location_id: locationId,
      },
      headers,
    })
    .then(({ return: returnData }) => ({
      success: true,
      error: null,
      return: returnData,
    }))
    .catch((err) => ({
      success: false,
      error: err.message,
      return: null,
    }))
}
