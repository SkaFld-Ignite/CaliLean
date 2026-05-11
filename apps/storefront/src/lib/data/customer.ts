"use server"

import "server-only"
import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"
import { getSafeRedirectPath } from "@lib/util/safe-redirect"

export const getCustomer = cache(async function () {
  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...(await getAuthHeaders()) })
    .then(({ customer }) => customer)
    .catch(() => null)
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, await getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag("customer")
  return updateRes
})

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(
      typeof loginToken === "string" ? loginToken : loginToken.location
    )

    revalidateTag("customer")
    const redirectTo = formData.get("redirect") as string
    return {
      success: true as const,
      firstName: customerForm.first_name,
      redirectTo: getSafeRedirectPath(redirectTo),
    }
  } catch (error: any) {
    if (isRedirectError(error)) throw error
    const msg = error?.response?.data?.message || error?.message || ""
    if (
      msg.toLowerCase().includes("already exists") ||
      msg.toLowerCase().includes("duplicate")
    ) {
      return "An account with this email already exists."
    }
    return "Something went wrong. Please try again."
  }
}

export async function setGoogleAuthToken(token: string) {
  await setAuthToken(token)
  revalidateTag("customer")
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })
    await setAuthToken(typeof token === "string" ? token : token.location)
    revalidateTag("customer")
    const redirectTo = formData.get("redirect") as string
    redirect(getSafeRedirectPath(redirectTo))
  } catch (error: any) {
    if (isRedirectError(error)) throw error
    return "Invalid email or password."
  }
}

export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
    return { success: true, error: null }
  } catch (error: any) {
    // Always return success to prevent email enumeration
    return { success: true, error: null }
  }
}

export async function resetPassword(
  _currentState: unknown,
  formData: FormData
) {
  const token = formData.get("token") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." }
  }

  try {
    await sdk.auth.updateProvider("customer", "emailpass", { password }, token)
    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: "Unable to reset password. The link may have expired.",
    }
  }
}

export async function updatePassword(
  _currentState: Record<string, unknown>,
  formData: FormData
) {
  const email = formData.get("email") as string
  const oldPassword = formData.get("old_password") as string
  const newPassword = formData.get("new_password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" }
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }

  try {
    // Verify old password by attempting login
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password: oldPassword,
    })

    const resetToken = typeof token === "string" ? token : ""

    // Update to new password using the token
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password: newPassword },
      resetToken
    )

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: "Current password is incorrect" }
  }
}

export async function signout(_countryCode?: string) {
  await sdk.auth.logout()
  await removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
  redirect("/gate")
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .createAddress(address, {}, await getAuthHeaders())
    .then(({ customer }) => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, await getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, await getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
