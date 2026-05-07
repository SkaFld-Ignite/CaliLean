"use client"

import React, { useEffect, useState } from "react"
import type { ResearchHeading } from "@lib/mdx"

type ResearchNavProps = {
  headings: ResearchHeading[]
}

const ResearchNav: React.FC<ResearchNavProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id || "")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    )

    for (const heading of headings) {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (headings.length === 0) return null

  return (
    <>
      {/* Desktop: sticky side nav */}
      <nav className="hidden small:block sticky top-24 w-[180px] shrink-0 self-start">
        <p className="text-[9px] uppercase tracking-widest text-calilean-fog mb-3">
          On this page
        </p>
        <ul className="space-y-1">
          {headings.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => handleClick(h.id)}
                className={`w-full text-left text-xs py-1.5 px-2.5 rounded transition-colors ${
                  activeId === h.id
                    ? "bg-calilean-pacific/10 text-calilean-pacific border-l-2 border-calilean-pacific"
                    : "text-calilean-fog hover:text-calilean-ink"
                }`}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: horizontal scrollable pill bar */}
      <nav className="small:hidden sticky top-[64px] z-30 bg-calilean-bg border-b border-calilean-sand -mx-4 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => handleClick(h.id)}
              className={`whitespace-nowrap text-xs py-1.5 px-3 rounded-full border transition-colors ${
                activeId === h.id
                  ? "bg-calilean-pacific/10 border-calilean-pacific text-calilean-pacific"
                  : "border-calilean-sand text-calilean-fog hover:text-calilean-ink"
              }`}
            >
              {h.text}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}

export default ResearchNav
