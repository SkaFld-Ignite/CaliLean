import { NextRequest, NextResponse } from "next/server"
import { sdk } from "@lib/config"
import { getSafeRedirectPath } from "@lib/util/safe-redirect"

const GOOGLE_REDIRECT_COOKIE = "_cl_google_redirect"

const getPublicBaseUrl = (request: NextRequest) => {
  return process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
}

const getSafeRedirectTo = (request: NextRequest) => {
  const rawRedirect =
    request.nextUrl.searchParams.get("redirect") ||
    request.cookies.get(GOOGLE_REDIRECT_COOKIE)?.value ||
    "/"

  let redirectTo = "/"
  try {
    redirectTo = decodeURIComponent(rawRedirect)
  } catch {
    redirectTo = rawRedirect
  }

  return getSafeRedirectPath(redirectTo)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const safeRedirectTo = getSafeRedirectTo(request)
  const publicBaseUrl = getPublicBaseUrl(request)

  if (error) {
    return NextResponse.redirect(new URL(`/gate?error=${error}`, publicBaseUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/gate?error=no_code", publicBaseUrl))
  }

  try {
    // Exchange the code for a token
    const queryParams = Object.fromEntries(searchParams.entries())
    delete queryParams.redirect
    const token = await sdk.auth.callback("customer", "google", queryParams)

    if (typeof token === "string") {
      const response = NextResponse.redirect(new URL(safeRedirectTo, publicBaseUrl))
      response.cookies.delete(GOOGLE_REDIRECT_COOKIE)

      // Set the Medusa JWT cookie so the middleware and hooks recognize the session
      response.cookies.set("_medusa_jwt", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    }

    return NextResponse.redirect(new URL("/gate?error=auth_failed", publicBaseUrl))
  } catch (err: any) {
    console.error("Google OAuth callback error:", err.message)
    return NextResponse.redirect(new URL("/gate?error=exception", publicBaseUrl))
  }
}
