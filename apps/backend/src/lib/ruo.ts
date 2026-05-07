/**
 * Research-Use-Only (RUO) compliance — backend wrapper.
 *
 * Shared constants and helpers live in @calilean/ruo-compliance.
 * This module reads the backend-specific env var and re-exports everything
 * so existing `@lib/ruo` imports continue to work unchanged.
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

/**
 * Read the backend deny-list from `RUO_GEO_DENY_STATES` env var.
 * Keep in sync with the storefront's `NEXT_PUBLIC_RUO_GEO_DENY_STATES`.
 * See `docs/ops/per-state-suppression.md` for the suppression runbook.
 */
export function getRuoGeoDenyStates(): readonly string[] {
  return parseGeoDenyStates(process.env.RUO_GEO_DENY_STATES ?? "")
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
