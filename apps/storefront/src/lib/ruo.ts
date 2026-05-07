/**
 * Research-Use-Only (RUO) compliance copy.
 *
 * Single source of truth for every disclaimer, attestation, and legal-adjacent
 * string surfaced in the storefront and transactional emails.
 *
 * Posture (board-set 2026-04-26): minimize disclaimer surface. Use
 * RUO_DISCLAIMER_SHORT as the workhorse line everywhere outwardly visible.
 * RUO_DISCLAIMER_LONG is reserved for ToS/Privacy carve-outs — do not
 * surface it on PDP, cart, or checkout.
 *
 * Versioning: bump RUO_ATTESTATION_VERSION whenever attestation language
 * changes, so order metadata records which version a customer agreed to.
 */

export const RUO_DISCLAIMER_SHORT =
  "For research use only. Not for human consumption."

export const RUO_DISCLAIMER_LONG =
  "All CaliLean products are sold strictly for in-vitro research and laboratory use. They are not drugs, supplements, food, or cosmetics, and they are not intended to diagnose, treat, cure, or prevent any disease. Products are not for human or animal consumption. By purchasing, you confirm you are a qualified researcher and accept full responsibility for safe handling and lawful use under all applicable federal, state, and institutional regulations."

export const RUO_ATTESTATION_LABEL =
  "I confirm I am a qualified researcher purchasing for in-vitro research only. I will not consume these products or administer them to humans or animals."

export const RUO_ATTESTATION_VERSION = "1.1"

export const RUO_AGE_GATE_HEADLINE = "Access research compounds."

export const RUO_AGE_GATE_BODY =
  "CaliLean sells research-grade peptides for laboratory use only. You must be 21 or older to enter."

export const RUO_LEGAL_LAST_UPDATED = "April 26, 2026"

export const RUO_LEGAL_CONTACT_EMAIL = "hello@calilean.com"

/**
 * Per-state geo deny-list for US shipping. Day-0 board posture is ship-to-all-50;
 * deny-list stays empty until counsel returns the state-by-state RUO posture
 * sweep (see SKA-25 / SKA-26). When a state is added, the storefront blocks
 * checkout for that state and the backend audit subscriber logs any order
 * that bypassed the gate.
 *
 * Source of truth is the `NEXT_PUBLIC_RUO_GEO_DENY_STATES` env var, a
 * comma-separated list of 2-letter uppercase US state codes (e.g.
 * "NJ,MA,LA"). Empty / unset = allow all. The `NEXT_PUBLIC_` prefix is
 * required so client components can render the inline deny message; server
 * actions read the same var at runtime. See
 * `docs/ops/per-state-suppression.md` for the suppression runbook.
 */
export function getRuoGeoDenyStates(): readonly string[] {
  const raw = process.env.NEXT_PUBLIC_RUO_GEO_DENY_STATES ?? ""
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

export const RUO_GEO_DENY_MESSAGE_TEMPLATE =
  "We do not currently ship to {state}. Contact hello@calilean.com if you have questions."

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  "DISTRICT OF COLUMBIA": "DC",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
}

export function normalizeUsStateCode(province: string): string {
  const upper = province.trim().toUpperCase()
  if (upper.length === 2) return upper
  return US_STATE_NAME_TO_CODE[upper] ?? upper
}

/**
 * Returns true if a US shipping address with the given province is allowed
 * under the current geo deny-list. Non-US country codes always return true —
 * the deny-list is US-state-scoped. An empty deny-list returns true.
 */
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

export function getGeoDenyMessage(province: string): string {
  const display = province.trim() || "your state"
  return RUO_GEO_DENY_MESSAGE_TEMPLATE.replace("{state}", display)
}
