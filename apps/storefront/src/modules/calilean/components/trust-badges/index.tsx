const badges = [
  { label: "COA published", icon: "clipboard-check" },
  { label: "Lot-traceable", icon: "shield-check" },
  { label: "Lyophilized", icon: "check" },
  { label: "2-day US shipping", icon: "zap" },
  { label: "Encrypted checkout", icon: "lock" },
  { label: "Returns within 30 days", icon: "refresh" },
]

const iconPaths: Record<string, string> = {
  "shield-check":
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  check: "M5 13l4 4L19 7",
  refresh:
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  zap: "M13 10V3L4 14h7v7l9-11h-7z",
  "clipboard-check":
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
}

const TrustBadges = () => {
  return (
    <div className="grid grid-cols-3 small:grid-cols-6 gap-3">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex flex-col items-center text-center gap-1.5 p-3 bg-calilean-sand rounded-lg"
        >
          <svg
            className="w-5 h-5 text-calilean-fog"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={iconPaths[b.icon]} />
          </svg>
          <span className="text-[11px] font-medium text-calilean-fog leading-tight">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default TrustBadges
