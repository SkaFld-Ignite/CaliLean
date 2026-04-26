"use client"

import { useState, useEffect } from "react"
import CaliLeanLogo from "@modules/calilean/icons/calilean-logo"

const AgeGate = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("age-verified")) {
      setVisible(true)
      document.body.style.overflow = "hidden"
    }
  }, [])

  const accept = () => {
    sessionStorage.setItem("age-verified", "true")
    setVisible(false)
    document.body.style.overflow = ""
  }

  const decline = () => {
    window.location.href = "https://www.google.com"
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-bluum-bg p-10 rounded-2xl text-center max-w-md w-[90%]">
        <CaliLeanLogo className="h-8 mx-auto mb-6" color="#1F2326" tracking="display" />
        <p className="text-lg font-semibold mb-2">You must be at least 21 to visit this site.</p>
        <p className="text-sm text-bluum-muted mb-6">By entering this site, you are accepting our Terms of Service</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={decline}
            className="px-6 py-2.5 border-[1.5px] border-bluum-text rounded-btn text-sm font-medium hover:bg-bluum-text hover:text-bluum-bg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-6 py-2.5 bg-bluum-primary text-bluum-text rounded-btn text-sm font-medium hover:opacity-85 transition-opacity"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgeGate
