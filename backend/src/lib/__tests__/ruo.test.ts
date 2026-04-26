import {
  RUO_DISCLAIMER_SHORT,
  RUO_DISCLAIMER_LONG,
  RUO_ATTESTATION_VERSION,
} from "../ruo"

describe("RUO compliance constants (backend mirror)", () => {
  it("exposes the short disclaimer used in cart/checkout/email", () => {
    expect(RUO_DISCLAIMER_SHORT).toMatch(/research use only/i)
    expect(RUO_DISCLAIMER_SHORT).toMatch(/not for human consumption/i)
  })

  it("exposes a long disclaimer that names the responsibilities", () => {
    expect(RUO_DISCLAIMER_LONG).toMatch(/in-vitro research/i)
    expect(RUO_DISCLAIMER_LONG).toMatch(/qualified researcher/i)
    expect(RUO_DISCLAIMER_LONG).toMatch(/CaliLean/)
  })

  it("pins the attestation version so audit trails are stable", () => {
    expect(RUO_ATTESTATION_VERSION).toBe("1.0")
  })
})
