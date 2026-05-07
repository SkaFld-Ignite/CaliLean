import SubscriptionModuleService from "../modules/subscription/service"
import {
  SubscriptionInterval,
} from "../modules/subscription/types"

// ---------------------------------------------------------------------------
// We test the two pure date-calculation methods on the service class.
// They don't touch the database, so we can instantiate a minimal instance
// by bypassing the MedusaService constructor.
// ---------------------------------------------------------------------------

function createService(): SubscriptionModuleService {
  // getNextOrderDate and getExpirationDate are plain methods that only use
  // date-fns — no DI container needed.
  return Object.create(SubscriptionModuleService.prototype)
}

describe("SubscriptionModuleService.getExpirationDate", () => {
  const service = createService()

  it("adds N months for a monthly subscription", () => {
    const result = service.getExpirationDate({
      subscription_date: new Date("2025-01-15T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 3,
    })

    expect(result.toISOString()).toContain("2025-04-15")
  })

  it("adds N years for a yearly subscription", () => {
    const result = service.getExpirationDate({
      subscription_date: new Date("2025-06-01T00:00:00Z"),
      interval: SubscriptionInterval.YEARLY,
      period: 2,
    })

    expect(result.toISOString()).toContain("2027-06-01")
  })

  it("handles period=0 as indefinite (100 years out)", () => {
    const result = service.getExpirationDate({
      subscription_date: new Date("2025-01-01T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 0,
    })

    expect(result.getFullYear()).toBe(2125)
  })

  it("handles end-of-month: Jan 31 + 1 month = Feb 28", () => {
    const result = service.getExpirationDate({
      subscription_date: new Date("2025-01-31T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    // date-fns clamps to the last day of the target month
    expect(result.getUTCMonth()).toBe(1) // February (0-indexed)
    expect(result.getUTCDate()).toBe(28)
  })

  it("handles leap year: Jan 31 + 1 month in 2024 = Feb 29", () => {
    const result = service.getExpirationDate({
      subscription_date: new Date("2024-01-31T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result.getUTCMonth()).toBe(1)
    expect(result.getUTCDate()).toBe(29)
  })

  it("handles crossing year boundary: Nov + 3 months = Feb next year", () => {
    const result = service.getExpirationDate({
      subscription_date: new Date("2025-11-15T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 3,
    })

    expect(result.getFullYear()).toBe(2026)
    expect(result.getUTCMonth()).toBe(1) // February
    expect(result.getUTCDate()).toBe(15)
  })
})

describe("SubscriptionModuleService.getNextOrderDate", () => {
  const service = createService()

  it("advances by period months for monthly subscription", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-03-01T00:00:00Z"),
      expiration_date: new Date("2026-03-01T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).not.toBeNull()
    expect(result!.toISOString()).toContain("2025-04-01")
  })

  it("advances by period years for yearly subscription", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-01-01T00:00:00Z"),
      expiration_date: new Date("2030-01-01T00:00:00Z"),
      interval: SubscriptionInterval.YEARLY,
      period: 1,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2026)
  })

  it("returns null when next order date would be after expiration", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-06-01T00:00:00Z"),
      expiration_date: new Date("2025-06-15T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).toBeNull()
  })

  it("returns the date when it exactly equals expiration", () => {
    // isAfter is strict — equal dates are NOT considered "after"
    const expDate = new Date("2025-07-01T00:00:00Z")
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-06-01T00:00:00Z"),
      expiration_date: expDate,
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).not.toBeNull()
  })

  it("period=0 (indefinite) advances by 1 month", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-03-15T00:00:00Z"),
      expiration_date: new Date("2125-03-15T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 0,
    })

    expect(result).not.toBeNull()
    expect(result!.toISOString()).toContain("2025-04-15")
  })

  it("handles month-end rollover: Mar 31 + 1 month = Apr 30", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-03-31T00:00:00Z"),
      expiration_date: new Date("2026-03-31T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).not.toBeNull()
    expect(result!.getUTCMonth()).toBe(3) // April
    expect(result!.getUTCDate()).toBe(30)
  })

  it("multi-period advance: period=3 adds 3 months at once", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-01-15T00:00:00Z"),
      expiration_date: new Date("2026-01-15T00:00:00Z"),
      interval: SubscriptionInterval.MONTHLY,
      period: 3,
    })

    expect(result).not.toBeNull()
    expect(result!.toISOString()).toContain("2025-04-15")
  })

  it("yearly with period=2 advances by 2 years", () => {
    const result = service.getNextOrderDate({
      last_order_date: new Date("2025-01-01T00:00:00Z"),
      expiration_date: new Date("2035-01-01T00:00:00Z"),
      interval: SubscriptionInterval.YEARLY,
      period: 2,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2027)
  })
})
