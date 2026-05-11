"use client"

import { Suspense, useState, useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useSearchParams, useRouter } from "next/navigation"
import CaliLeanLogo from "@modules/calilean/icons/calilean-logo"
import { login, signup, requestPasswordReset } from "@lib/data/customer"
import GoogleAuthButton from "@modules/account/components/google-auth-button"

type GateView = "sign-in" | "register" | "forgot-password"

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
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

function AgeSubmitButton({
  disabled,
  children,
}: {
  disabled: boolean
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full bg-calilean-pacific text-white rounded-btn py-3 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
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
          Creating account...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default function GatePage() {
  return (
    <Suspense>
      <GatePageInner />
    </Suspense>
  )
}

function GatePageInner() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || ""
  const isGuestCheckout = searchParams.get("guest_checkout") === "1"
  const [view, setView] = useState<GateView>(
    isGuestCheckout ? "register" : "sign-in"
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-calilean-bg overflow-hidden">
      {/* Animated blue aura */}
      <style jsx>{`
        @keyframes meshMove {
          0% {
            background-position: 0% 50%, 100% 50%, 50% 100%;
          }
          25% {
            background-position: 100% 0%, 0% 100%, 80% 20%;
          }
          50% {
            background-position: 50% 100%, 50% 0%, 0% 50%;
          }
          75% {
            background-position: 0% 100%, 100% 0%, 20% 80%;
          }
          100% {
            background-position: 0% 50%, 100% 50%, 50% 100%;
          }
        }
      `}</style>

      {/* Primary aura layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 50%, rgba(112,144,171,0.45) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 100% 50%, rgba(112,144,171,0.35) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(112,144,171,0.30) 0%, transparent 50%)
          `,
          backgroundSize: "200% 200%, 200% 200%, 200% 200%",
          animation: "meshMove 30s ease-in-out infinite",
        }}
      />

      {/* Secondary layer for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 70% at 70% 30%, rgba(112,144,171,0.25) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 30% 70%, rgba(112,144,171,0.20) 0%, transparent 50%)
          `,
          backgroundSize: "200% 200%",
          animation: "meshMove 45s ease-in-out infinite reverse",
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-10 left-10 hidden small:block">
        <div className="w-[100px] h-[1px] bg-gradient-to-r from-[#7090AB]/40 to-transparent" />
        <div className="w-[1px] h-[100px] bg-gradient-to-b from-[#7090AB]/40 to-transparent" />
      </div>
      <div className="absolute bottom-10 right-10 hidden small:flex flex-col items-end">
        <div className="w-[1px] h-[100px] bg-gradient-to-t from-[#7090AB]/40 to-transparent ml-auto" />
        <div className="w-[100px] h-[1px] bg-gradient-to-l from-[#7090AB]/40 to-transparent" />
      </div>

      <div className="w-full max-w-[480px] text-center relative z-10">
        {/* Logo */}
        <div className="w-[340px] small:w-[420px] mx-auto overflow-hidden">
          <div className="-my-[30%]">
            <CaliLeanLogo className="w-full h-auto" color="black" />
          </div>
        </div>

        <p className="text-[#7090AB] text-[13px] uppercase tracking-[0.2em] font-medium mt-8 mb-8">
          Sequenced for results
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-[1.5px] bg-gradient-to-r from-transparent to-[#7090AB]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7090AB]" />
          <div className="w-8 h-[1.5px] bg-gradient-to-l from-transparent to-[#7090AB]" />
        </div>

        <h1 className="text-calilean-ink text-[28px] font-semibold tracking-tight mb-10">
          Enter.
        </h1>

        <div className="max-w-[340px] mx-auto relative">
          {isGuestCheckout && (
            <div className="mb-4 bg-calilean-pacific/10 border border-calilean-pacific/20 rounded-xl px-4 py-3 text-left">
              <p className="text-calilean-ink text-sm font-medium">
                Create an account to checkout
              </p>
              <p className="text-calilean-fog text-xs mt-1 leading-relaxed">
                Your cart is saved. Sign in or create an account to complete
                your purchase.
              </p>
            </div>
          )}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-[#7090AB]/20 via-transparent to-[#7090AB]/10 pointer-events-none" />
          <div className="bg-calilean-bg/80 backdrop-blur-sm rounded-2xl p-6 relative">
            {view === "sign-in" ? (
              <SignInForm
                onSwitch={() => setView("register")}
                onForgot={() => setView("forgot-password")}
                redirectTo={redirectTo}
              />
            ) : view === "forgot-password" ? (
              <ForgotPasswordForm onBack={() => setView("sign-in")} />
            ) : (
              <RegisterForm
                onSwitch={() => setView("sign-in")}
                redirectTo={redirectTo}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-10">
          <div className="w-8 h-[1.5px] bg-gradient-to-r from-transparent to-[#7090AB]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7090AB]" />
          <div className="w-8 h-[1.5px] bg-gradient-to-l from-transparent to-[#7090AB]" />
        </div>
      </div>
    </div>
  )
}

function SignInForm({
  onSwitch,
  onForgot,
  redirectTo,
}: {
  onSwitch: () => void
  onForgot: () => void
  redirectTo: string
}) {
  const [message, formAction] = useActionState(login, null)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
        className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        autoComplete="current-password"
        className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
      />
      {message && typeof message === "string" && (
        <p className="text-calilean-alert text-xs">{message}</p>
      )}
      <div className="flex justify-end -mt-1">
        <button
          type="button"
          onClick={onForgot}
          className="text-calilean-pacific text-xs hover:text-calilean-pacific/80 transition-colors"
        >
          Forgot password?
        </button>
      </div>
      <SubmitButton>Sign in</SubmitButton>
      <div className="flex items-center w-full my-4">
        <div className="flex-1 border-t border-calilean-fog/20" />
        <span className="px-3 text-[10px] text-calilean-fog/40 uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 border-t border-calilean-fog/20" />
      </div>
      <GoogleAuthButton
        action="login"
        redirectTo={redirectTo || "/"}
        className="bg-white border-calilean-sand hover:bg-calilean-sand/50"
      />
      <p className="text-calilean-fog text-xs mt-6">
        New here?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-calilean-pacific hover:text-calilean-pacific/80 transition-colors"
        >
          Create an account
        </button>
      </p>
    </form>
  )
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [state, formAction] = useActionState(requestPasswordReset, null)
  const sent = state?.success === true

  return (
    <div className="flex flex-col gap-3">
      {sent ? (
        <>
          <div className="text-center py-2">
            <div className="w-10 h-10 rounded-full bg-calilean-pacific/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-5 h-5 text-calilean-pacific"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-calilean-ink text-sm font-medium mb-1">
              Check your email
            </p>
            <p className="text-calilean-fog text-xs leading-relaxed">
              If an account exists with that email, we sent a link to reset your
              password.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full bg-calilean-pacific text-white rounded-btn py-3 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors mt-2"
          >
            Back to sign in
          </button>
        </>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <p className="text-calilean-ink text-sm font-medium text-center mb-1">
            Reset your password
          </p>
          <p className="text-calilean-fog text-xs text-center mb-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
          />
          <SubmitButton>Send reset link</SubmitButton>
          <p className="text-calilean-fog text-xs mt-4 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-calilean-pacific hover:text-calilean-pacific/80 transition-colors"
            >
              Back to sign in
            </button>
          </p>
        </form>
      )}
    </div>
  )
}

function RegisterForm({
  onSwitch,
  redirectTo,
}: {
  onSwitch: () => void
  redirectTo: string
}) {
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [message, formAction] = useActionState(signup, null)
  const router = useRouter()

  const isSuccess =
    message && typeof message === "object" && message.success === true

  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(
      () => router.replace((message as { redirectTo: string }).redirectTo),
      2500
    )
    return () => clearTimeout(timer)
  }, [isSuccess, message, router])

  if (isSuccess) {
    const { firstName, redirectTo: dest } = message as {
      firstName: string
      redirectTo: string
    }
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-12 h-12 rounded-full bg-calilean-pacific/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-calilean-pacific"
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
        <div>
          <p className="text-calilean-ink text-base font-semibold mb-1">
            Welcome, {firstName}!
          </p>
          <p className="text-calilean-fog text-xs leading-relaxed">
            Your account is ready. Signing you in now…
          </p>
        </div>
        <button
          onClick={() => router.replace(dest)}
          className="w-full bg-calilean-pacific text-white rounded-btn py-3 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors mt-2"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
      <div className="grid grid-cols-2 gap-3">
        <input
          name="first_name"
          type="text"
          placeholder="First name"
          required
          autoComplete="given-name"
          className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
        />
        <input
          name="last_name"
          type="text"
          placeholder="Last name"
          required
          autoComplete="family-name"
          className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
        className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone"
        autoComplete="tel"
        className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors"
      />
      <div>
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-calilean-sand border border-transparent rounded-btn px-4 py-3 text-sm text-calilean-ink placeholder:text-calilean-fog/60 outline-none focus:border-calilean-pacific/30 transition-colors invalid:[&:not(:placeholder-shown)]:border-calilean-alert/30"
        />
        <p className="text-[11px] text-calilean-fog/50 text-left mt-1.5 ml-1">
          Minimum 8 characters
        </p>
      </div>
      <label className="flex items-start gap-2.5 text-left mt-2">
        <input
          type="checkbox"
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
          className="mt-0.5 accent-calilean-pacific"
          required
        />
        <span className="text-xs text-calilean-fog leading-relaxed">
          I confirm I am 21 or older and agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            className="text-calilean-pacific hover:text-calilean-pacific/80 transition-colors"
          >
            Terms of Service
          </a>
          .
        </span>
      </label>
      {message && typeof message === "string" && (
        <p className="text-calilean-alert text-xs">{message}</p>
      )}
      <AgeSubmitButton disabled={!ageConfirmed}>Create account</AgeSubmitButton>
      <div className="flex items-center w-full my-4">
        <div className="flex-1 border-t border-calilean-fog/20" />
        <span className="px-3 text-[10px] text-calilean-fog/40 uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 border-t border-calilean-fog/20" />
      </div>
      <GoogleAuthButton
        action="register"
        redirectTo={redirectTo || "/"}
        className="bg-white border-calilean-sand hover:bg-calilean-sand/50"
      />
      <p className="text-calilean-fog text-xs mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-calilean-pacific hover:text-calilean-pacific/80 transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}
