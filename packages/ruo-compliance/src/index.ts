/**
 * @calilean/ruo-compliance — shared Research-Use-Only compliance constants and helpers.
 *
 * This package is the single source of truth for RUO disclaimer copy,
 * attestation strings, and US-state geo-deny logic. Both the backend and
 * storefront import from here; each app reads its own env var and passes the
 * deny list in.
 *
 * Versioning: bump RUO_ATTESTATION_VERSION whenever attestation language
 * changes so order metadata records which version a customer agreed to.
 */

// ---------------------------------------------------------------------------
// Disclaimer & attestation copy
// ---------------------------------------------------------------------------

export const RUO_DISCLAIMER_SHORT =
  "For research use only. Not for human consumption."

export const RUO_DISCLAIMER_LONG =
  "All CaliLean products are sold strictly for in-vitro research and laboratory use. They are not drugs, supplements, food, or cosmetics, and they are not intended to diagnose, treat, cure, or prevent any disease. Products are not for human or animal consumption. By purchasing, you confirm you are a qualified researcher and accept full responsibility for safe handling and lawful use under all applicable federal, state, and institutional regulations."

export const RUO_ATTESTATION_LABEL =
  "I confirm I am a qualified researcher purchasing for in-vitro research only. I will not consume these products or administer them to humans or animals."

export const RUO_ATTESTATION_VERSION = "1.1"

export const RUO_LEGAL_LAST_UPDATED = "April 26, 2026"

export const RUO_LEGAL_CONTACT_EMAIL = "hello@calilean.com"

export const RUO_GEO_DENY_MESSAGE_TEMPLATE =
  "We do not currently ship to {state}. Contact hello@calilean.com if you have questions."

// ---------------------------------------------------------------------------
// US state lookup
// ---------------------------------------------------------------------------

export const US_STATE_NAME_TO_CODE: Record<string, string> = {
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

// ---------------------------------------------------------------------------
// Geo-deny helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a US state name or code to its 2-letter uppercase code.
 * If the input is already 2 characters it is uppercased and returned as-is.
 * Full state names are looked up in US_STATE_NAME_TO_CODE; unrecognized
 * inputs are returned uppercased (caller decides how to handle).
 */
export function normalizeUsStateCode(province: string): string {
  const upper = province.trim().toUpperCase()
  if (upper.length === 2) return upper
  return US_STATE_NAME_TO_CODE[upper] ?? upper
}

/**
 * Parse a comma-separated deny-list string (e.g. "NJ,MA,LA") into a
 * deduplicated array of 2-letter uppercase state codes. Each app calls this
 * with the value of its own env var.
 */
export function parseGeoDenyStates(raw: string): readonly string[] {
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

/**
 * Returns true if the given US state is allowed (not on the deny list).
 * Non-US country codes always return true. An empty deny list returns true.
 *
 * @param province - State name or 2-letter code
 * @param countryCode - ISO country code (only "us"/"US" is checked)
 * @param denyList - Array of denied 2-letter state codes
 */
export function isUsStateAllowed(
  province: string | null | undefined,
  countryCode: string | null | undefined,
  denyList: readonly string[]
): boolean {
  if (denyList.length === 0) return true
  if (!countryCode || countryCode.toLowerCase() !== "us") return true
  if (!province) return true
  return !denyList.includes(normalizeUsStateCode(province))
}

/**
 * Build the user-facing deny message for a given province.
 */
export function getGeoDenyMessage(province: string): string {
  const display = province.trim() || "your state"
  return RUO_GEO_DENY_MESSAGE_TEMPLATE.replace("{state}", display)
}
