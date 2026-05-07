/**
 * Research-Use-Only (RUO) compliance — storefront wrapper.
 *
 * Shared constants and helpers live in @calilean/ruo-compliance.
 * This module reads the storefront-specific env var and re-exports everything
 * so existing `@lib/ruo` imports continue to work unchanged.
 *
 * Posture (board-set 2026-04-26): minimize disclaimer surface. Use
 * RUO_DISCLAIMER_SHORT as the workhorse line everywhere outwardly visible.
 * RUO_DISCLAIMER_LONG is reserved for ToS/Privacy carve-outs — do not
 * surface it on PDP, cart, or checkout.
 */

import {
  parseGeoDenyStates,
  isUsStateAllowed as _isUsStateAllowed,
} from "@calilean/ruo-compliance"

// Re-export everything from the shared package
export {
  RUO_DISCLAIMER_SHORT,
  RUO_DISCLAIMER_LONG,
  RUO_ATTESTATION_LABEL,
  RUO_ATTESTATION_VERSION,
  RUO_LEGAL_LAST_UPDATED,
  RUO_LEGAL_CONTACT_EMAIL,
  RUO_GEO_DENY_MESSAGE_TEMPLATE,
  US_STATE_NAME_TO_CODE,
  normalizeUsStateCode,
  getGeoDenyMessage,
} from "@calilean/ruo-compliance"

// ---------------------------------------------------------------------------
// Storefront-only constants
// ---------------------------------------------------------------------------

export const RUO_AGE_GATE_HEADLINE = "Access research compounds."

export const RUO_AGE_GATE_BODY =
  "CaliLean sells research-grade peptides for laboratory use only. You must be 21 or older to enter."

// ---------------------------------------------------------------------------
// Env-var reading (storefront-specific)
// ---------------------------------------------------------------------------

/**
 * Read the storefront deny-list from `NEXT_PUBLIC_RUO_GEO_DENY_STATES`.
 * The `NEXT_PUBLIC_` prefix is required so client components can render the
 * inline deny message; server actions read the same var at runtime.
 * See `docs/ops/per-state-suppression.md` for the suppression runbook.
 */
export function getRuoGeoDenyStates(): readonly string[] {
  return parseGeoDenyStates(
    process.env.NEXT_PUBLIC_RUO_GEO_DENY_STATES ?? ""
  )
}

/**
 * Returns true if a US shipping address with the given province is allowed
 * under the current geo deny-list. Non-US country codes always return true.
 */
export function isUsStateAllowed(
  province: string | null | undefined,
  countryCode: string | null | undefined
): boolean {
  return _isUsStateAllowed(province, countryCode, getRuoGeoDenyStates())
}
