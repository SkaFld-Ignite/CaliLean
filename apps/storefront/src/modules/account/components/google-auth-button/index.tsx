"use client"

import { sdk } from "@lib/config"

type Props = {
  action?: "login" | "register"
  className?: string
  redirectTo?: string
}

const GoogleAuthButton = ({
  action = "login",
  className = "",
  redirectTo,
}: Props) => {
  const handleGoogleAuth = async () => {
    try {
      // Stash the intended destination so the callback page can restore it
      if (redirectTo) {
        sessionStorage.setItem("_cl_google_redirect", redirectTo)
      }
      const callbackUrl = new URL(
        "/api/auth/google/callback",
        window.location.origin
      )

      if (redirectTo?.startsWith("/")) {
        callbackUrl.searchParams.set("redirect", redirectTo)
      }

      const result = await sdk.auth.login("customer", "google", {
        callback_url: callbackUrl.toString(),
      })
      if (typeof result === "object" && result.location) {
        window.location.href = result.location
        return
      }
      if (typeof result === "string") {
        // Already authenticated, refresh
        window.location.href = redirectTo || "/"
        return
      }
    } catch (error) {
      console.error("Google auth error:", error)
      // Google auth not configured or failed, ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      className={`w-full flex items-center justify-center gap-2 border border-ui-border-base rounded-md py-2.5 px-4 text-sm font-medium text-ui-fg-base hover:bg-ui-bg-base-hover transition-colors ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {action === "login" ? "Sign in with Google" : "Sign up with Google"}
    </button>
  )
}

export default GoogleAuthButton
