"use client"

import { useState, useEffect, useRef } from "react"
import CaliLeanLogo from "@modules/calilean/icons/calilean-logo"
import { RUO_AGE_GATE_HEADLINE, RUO_AGE_GATE_BODY } from "@lib/ruo"

const AgeGate = () => {
  const [visible, setVisible] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !sessionStorage.getItem("age-verified")
    ) {
      setVisible(true)
      document.body.style.overflow = "hidden"
    }
  }, [])

  // Focus trap: focus first button on mount, wrap Tab at boundaries
  useEffect(() => {
    if (!visible || !dialogRef.current) return

    const focusableEls = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstEl = focusableEls[0]
    const lastEl = focusableEls[focusableEls.length - 1]

    firstEl?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl?.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [visible])

  const accept = () => {
    sessionStorage.setItem("age-verified", "true")
    setVisible(false)
    document.body.style.overflow = ""
  }

  const decline = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = "about:blank"
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-heading"
      ref={dialogRef}
    >
      <div className="bg-calilean-bg p-10 rounded-2xl text-center max-w-md w-[90%]">
        <CaliLeanLogo className="h-12 w-auto mx-auto mb-6" color="black" />
        <p id="age-gate-heading" className="text-lg font-semibold mb-2">{RUO_AGE_GATE_HEADLINE}</p>
        <p className="text-sm text-calilean-fog mb-6">{RUO_AGE_GATE_BODY}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={decline}
            className="px-6 py-2.5 border-[1.5px] border-calilean-ink rounded-btn text-sm font-medium hover:bg-calilean-ink hover:text-calilean-bg transition-colors"
          >
            Leave
          </button>
          <button
            onClick={accept}
            className="px-6 py-2.5 bg-calilean-coa text-calilean-bg rounded-btn text-sm font-medium hover:opacity-85 transition-opacity"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgeGate
