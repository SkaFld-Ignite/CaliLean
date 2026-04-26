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
  "All CaliLean products are sold strictly for in-vitro research and laboratory use. They are not drugs, food, cosmetics, or dietary supplements, and are not intended to diagnose, treat, cure, or prevent any disease. Products are not for human or animal consumption. By purchasing, you confirm you are a qualified researcher and accept full responsibility for safe handling and lawful use."

export const RUO_ATTESTATION_LABEL =
  "I am a qualified researcher and will not consume these products."

export const RUO_ATTESTATION_VERSION = "1.0"

export const RUO_AGE_GATE_HEADLINE = "Access research compounds"

export const RUO_AGE_GATE_BODY =
  "CaliLean sells research-grade peptides for laboratory use only. You must be 21 or older to enter."

export const RUO_LEGAL_LAST_UPDATED = "April 26, 2026"

export const RUO_LEGAL_CONTACT_EMAIL = "hello@calilean.bio"
