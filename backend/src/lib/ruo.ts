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
  "All CaliLean products are sold strictly for in-vitro research and laboratory use. They are not drugs, food, cosmetics, or dietary supplements, and are not intended to diagnose, treat, cure, or prevent any disease. Products are not for human or animal consumption. By purchasing, you confirm you are a qualified researcher and accept full responsibility for safe handling and lawful use."

export const RUO_ATTESTATION_VERSION = "1.0"
