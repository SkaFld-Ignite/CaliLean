"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Suspense } from "react"
import Link from "next/link"
import CaliLeanLogo from "@modules/calilean/icons/calilean-logo"
import { resetPassword } from "@lib/data/customer"

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-calilean-pacific text-white rounded-btn py-3 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Updating...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""
  const [state, formAction] = useActionState(resetPassword, null)

  const success = state?.success === true

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-calilean-bg">
      <div className="w-full max-w-[480px] text-center">
        <div className="w-[340px] small:w-[420px] mx-auto overflow-hidden">
          <div className="-my-[30%]">
            <CaliLeanLogo className="w-full h-auto" color="black" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8 mb-8">
          <div className="w-8 h-[1.5px] bg-gradient-to-r from-transparent to-calilean-pacific" />
          <div className="w-1.5 h-1.5 rounded-full bg-calilean-pacific" />
          <div className="w-8 h-[1.5px] bg-gradient-to-l from-transparent to-calilean-pacific" />
        </div>

        <div className="max-w-[340px] mx-auto relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-calilean-pacific/20 via-transparent to-calilean-pacific/10 pointer-events-none" />
          <div className="bg-calilean-bg/80 backdrop-blur-sm rounded-2xl p-6 relative">
            {!token ? (
              <div className="text-center py-2">
                <p className="text-calilean-ink text-sm font-medium mb-2">
                  Invalid reset link
                </p>
                <p className="text-calilean-fog text-xs mb-4">
                  This link is missing or malformed. Please request a new one.
                </p>
                <Link
                  href="/gate"
                  className="inline-block w-full bg-calilean-pacific text-white rounded-btn py-3 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            ) : success ? (
              <div className="text-center py-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-calilean-ink text-sm font-medium mb-1">
                  Password updated
                </p>
                <p className="text-calilean-fog text-xs mb-4">
                  Your password has been reset. You can now sign in.
                </p>
                <Link
                  href="/gate"
                  className="inline-block w-full bg-calilean-pacific text-white rounded-btn py-3 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <form action={formAction} className="flex flex-col gap-3">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="email" value={email} />
                <p className="text-calilean-ink text-sm font-medium text-center mb-1">
                  Choose a new password
                </p>
                {email && (
                  <p className="text-calilean-fog text-xs text-center mb-2">
                    for {email}
                  </p>
                )}
                <input
                  name="password"
                  type="password"
                  placeholder="New password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
                />
                <div>
                  <input
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
                  />
                  <p className="text-[11px] text-calilean-fog/50 text-left mt-1.5 ml-1">
                    Minimum 8 characters
                  </p>
                </div>
                {state?.error && (
                  <p className="text-calilean-alert text-xs">{state.error}</p>
                )}
                <SubmitButton>Reset password</SubmitButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-calilean-bg">
          <div className="animate-spin h-6 w-6 border-2 border-calilean-pacific border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
