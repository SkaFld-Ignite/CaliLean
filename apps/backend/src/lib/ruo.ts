/**
 * Research-Use-Only (RUO) compliance copy — backend mirror.
 *
 * Mirrors `storefront/src/lib/ruo.ts`. Backend and storefront are separate
 * apps with no shared workspace, so the canonical strings are duplicated
 * here for use in transactional emails and the cart-completed subscriber
 * that validates attestation metadata.
 *
 * If you change copy here, update `storefront/src/lib/ruo.ts` to match —
 * and bump RUO_ATTESTATION_VERSION when attestation language changes so
 * audit trails stay correct.
 */

export const RUO_DISCLAIMER_SHORT =
  "For research use only. Not for human consumption."

export const RUO_DISCLAIMER_LONG =
  "All CaliLean products are sold strictly for in-vitro research and laboratory use. They are not drugs, supplements, food, or cosmetics, and they are not intended to diagnose, treat, cure, or prevent any disease. Products are not for human or animal consumption. By purchasing, you confirm you are a qualified researcher and accept full responsibility for safe handling and lawful use under all applicable federal, state, and institutional regulations."

export const RUO_ATTESTATION_VERSION = "1.1"

/**
 * Per-state geo deny-list for US shipping. Mirror of `storefront/src/lib/ruo.ts`.
 * Day-0 posture: empty (ship-to-all-50). The order-placed geo-audit subscriber
 * logs an error if an order shipped to a deny-listed state — defense-in-depth
 * audit only, since the storefront gate blocks checkout earlier.
 *
 * Source of truth is the `RUO_GEO_DENY_STATES` env var (comma-separated
 * 2-letter uppercase US state codes). On a single Railway deploy the
 * storefront sets `NEXT_PUBLIC_RUO_GEO_DENY_STATES` and the backend sets
 * `RUO_GEO_DENY_STATES`; keep them in sync. See
 * `docs/ops/per-state-suppression.md` for the suppression runbook.
 */
export function getRuoGeoDenyStates(): readonly string[] {
  const raw = process.env.RUO_GEO_DENY_STATES ?? ""
  if (!raw.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const token of raw.split(",")) {
    const code = token.trim().toUpperCase()
    if (code.length !== 2) continue
    if (seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
}

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: "AL", ALASKA: "AK", ARIZONA: "AZ", ARKANSAS: "AR",
  CALIFORNIA: "CA", COLORADO: "CO", CONNECTICUT: "CT", DELAWARE: "DE",
  "DISTRICT OF COLUMBIA": "DC", FLORIDA: "FL", GEORGIA: "GA",
  HAWAII: "HI", IDAHO: "ID", ILLINOIS: "IL", INDIANA: "IN", IOWA: "IA",
  KANSAS: "KS", KENTUCKY: "KY", LOUISIANA: "LA", MAINE: "ME",
  MARYLAND: "MD", MASSACHUSETTS: "MA", MICHIGAN: "MI", MINNESOTA: "MN",
  MISSISSIPPI: "MS", MISSOURI: "MO", MONTANA: "MT", NEBRASKA: "NE",
  NEVADA: "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM", "NEW YORK": "NY", "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND", OHIO: "OH", OKLAHOMA: "OK", OREGON: "OR",
  PENNSYLVANIA: "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD", TENNESSEE: "TN", TEXAS: "TX", UTAH: "UT",
  VERMONT: "VT", VIRGINIA: "VA", WASHINGTON: "WA",
  "WEST VIRGINIA": "WV", WISCONSIN: "WI", WYOMING: "WY",
}

export function normalizeUsStateCode(province: string): string {
  const upper = province.trim().toUpperCase()
  if (upper.length === 2) return upper
  return US_STATE_NAME_TO_CODE[upper] ?? upper
}

export function isUsStateAllowed(
  province: string | null | undefined,
  countryCode: string | null | undefined
): boolean {
  const deny = getRuoGeoDenyStates()
  if (deny.length === 0) return true
  if (!countryCode || countryCode.toLowerCase() !== "us") return true
  if (!province) return true
  return !deny.includes(normalizeUsStateCode(province))
}
