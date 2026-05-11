"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import CaliLeanLogo from "@modules/calilean/icons/calilean-logo"

function AgeGateInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get("redirect") || "/"

  const confirm = () => {
    // Set _cl_age_ok cookie (30-day session) then redirect back
    document.cookie = `_cl_age_ok=1; path=/; max-age=${
      60 * 60 * 24 * 30
    }; samesite=lax`
    router.replace(redirectTo)
  }

  const deny = () => {
    // Soft exit — redirect to a neutral page or show inline message
    router.replace("https://www.responsibility.org/")
  }

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
        <div className="w-[100px] h-[1px] bg-gradient-to-r from-calilean-pacific/40 to-transparent" />
        <div className="w-[1px] h-[100px] bg-gradient-to-b from-calilean-pacific/40 to-transparent" />
      </div>
      <div className="absolute bottom-10 right-10 hidden small:flex flex-col items-end">
        <div className="w-[1px] h-[100px] bg-gradient-to-t from-calilean-pacific/40 to-transparent ml-auto" />
        <div className="w-[100px] h-[1px] bg-gradient-to-l from-calilean-pacific/40 to-transparent" />
      </div>

      <div className="w-full max-w-[480px] text-center relative z-10">
        {/* Logo */}
        <div className="w-[340px] small:w-[420px] mx-auto overflow-hidden">
          <div className="-my-[30%]">
            <CaliLeanLogo className="w-full h-auto" color="black" />
          </div>
        </div>

        <p className="text-calilean-pacific text-[13px] uppercase tracking-[0.2em] font-medium mt-8 mb-8">
          Sequenced for results
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-[1.5px] bg-gradient-to-r from-transparent to-calilean-pacific" />
          <div className="w-1.5 h-1.5 rounded-full bg-calilean-pacific" />
          <div className="w-8 h-[1.5px] bg-gradient-to-l from-transparent to-calilean-pacific" />
        </div>

        <h1 className="text-calilean-ink text-[28px] font-semibold tracking-tight mb-3">
          Are you 21 or older?
        </h1>
        <p className="text-calilean-fog text-sm mb-10 leading-relaxed">
          Our products are research-use-only peptides and compounds.
          <br />
          You must be 21 or older to enter.
        </p>

        <div className="max-w-[340px] mx-auto flex flex-col gap-3">
          <button
            onClick={confirm}
            className="w-full bg-calilean-pacific text-white rounded-btn py-3.5 text-sm font-medium hover:bg-calilean-pacific/90 transition-colors"
          >
            Yes, I am 21 or older
          </button>
          <button
            onClick={deny}
            className="w-full bg-calilean-sand text-calilean-fog rounded-btn py-3.5 text-sm font-medium hover:bg-calilean-fog/10 transition-colors"
          >
            No, I am under 21
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mt-10">
          <div className="w-8 h-[1.5px] bg-gradient-to-r from-transparent to-calilean-pacific" />
          <div className="w-1.5 h-1.5 rounded-full bg-calilean-pacific" />
          <div className="w-8 h-[1.5px] bg-gradient-to-l from-transparent to-calilean-pacific" />
        </div>
      </div>
    </div>
  )
}

export default function AgeGatePage() {
  return (
    <Suspense>
      <AgeGateInner />
    </Suspense>
  )
}
