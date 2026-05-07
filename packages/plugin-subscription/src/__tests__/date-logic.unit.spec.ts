import SubscriptionModuleService from "../modules/subscription/service"
import {
  SubscriptionInterval,
} from "../modules/subscription/types"

// ---------------------------------------------------------------------------
// We test the two pure date-calculation methods on the service class.
// They don't touch the database, so we can instantiate a minimal instance
// by bypassing the MedusaService constructor.
//
// NOTE: The service uses moment.js which interprets dates in LOCAL time.
// We construct dates without the "Z" suffix so they are treated as local
// time, and we assert with local-time getters (.getMonth(), .getDate()).
// ---------------------------------------------------------------------------

function createService(): SubscriptionModuleService {
  // getNextOrderDate and getExpirationDate are plain methods that only use
  // moment — no DI container needed.
  return Object.create(SubscriptionModuleService.prototype)
}

/** Helper: create a local-time Date (no UTC "Z" suffix). */
function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d) // month is 0-indexed in JS Date constructor
}

describe("SubscriptionModuleService.getExpirationDate", () => {
  const service = createService()

  it("adds N months for a monthly subscription", () => {
    const result = service.getExpirationDate({
      subscription_date: localDate(2025, 1, 15),
      interval: SubscriptionInterval.MONTHLY,
      period: 3,
    })

    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(3) // April (0-indexed)
    expect(result.getDate()).toBe(15)
  })

  it("adds N years for a yearly subscription", () => {
    const result = service.getExpirationDate({
      subscription_date: localDate(2025, 6, 1),
      interval: SubscriptionInterval.YEARLY,
      period: 2,
    })

    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(5) // June (0-indexed)
    expect(result.getDate()).toBe(1)
  })

  it("handles period=0 as indefinite (100 years out)", () => {
    const result = service.getExpirationDate({
      subscription_date: localDate(2025, 1, 1),
      interval: SubscriptionInterval.MONTHLY,
      period: 0,
    })

    expect(result.getFullYear()).toBe(2125)
  })

  it("handles end-of-month: Jan 31 + 1 month = Feb 28", () => {
    const result = service.getExpirationDate({
      subscription_date: localDate(2025, 1, 31),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    // moment clamps to the last day of the target month
    expect(result.getMonth()).toBe(1) // February (0-indexed)
    expect(result.getDate()).toBe(28)
  })

  it("handles leap year: Jan 31 + 1 month in 2024 = Feb 29", () => {
    const result = service.getExpirationDate({
      subscription_date: localDate(2024, 1, 31),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result.getMonth()).toBe(1) // February
    expect(result.getDate()).toBe(29)
  })

  it("handles crossing year boundary: Nov + 3 months = Feb next year", () => {
    const result = service.getExpirationDate({
      subscription_date: localDate(2025, 11, 15),
      interval: SubscriptionInterval.MONTHLY,
      period: 3,
    })

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getDate()).toBe(15)
  })
})

describe("SubscriptionModuleService.getNextOrderDate", () => {
  const service = createService()

  it("advances by period months for monthly subscription", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 3, 1),
      expiration_date: localDate(2026, 3, 1),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2025)
    expect(result!.getMonth()).toBe(3) // April
    expect(result!.getDate()).toBe(1)
  })

  it("advances by period years for yearly subscription", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 1, 1),
      expiration_date: localDate(2030, 1, 1),
      interval: SubscriptionInterval.YEARLY,
      period: 1,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2026)
  })

  it("returns null when next order date would be after expiration", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 6, 1),
      expiration_date: localDate(2025, 6, 15),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).toBeNull()
  })

  it("returns the date when it exactly equals expiration", () => {
    // moment isAfter is strict — equal dates are NOT considered "after"
    const expDate = localDate(2025, 7, 1)
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 6, 1),
      expiration_date: expDate,
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).not.toBeNull()
  })

  it("period=0 (indefinite) advances by 1 month", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 3, 15),
      expiration_date: localDate(2125, 3, 15),
      interval: SubscriptionInterval.MONTHLY,
      period: 0,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2025)
    expect(result!.getMonth()).toBe(3) // April
    expect(result!.getDate()).toBe(15)
  })

  it("handles month-end rollover: Mar 31 + 1 month = Apr 30", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 3, 31),
      expiration_date: localDate(2026, 3, 31),
      interval: SubscriptionInterval.MONTHLY,
      period: 1,
    })

    expect(result).not.toBeNull()
    expect(result!.getMonth()).toBe(3) // April
    expect(result!.getDate()).toBe(30)
  })

  it("multi-period advance: period=3 adds 3 months at once", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 1, 15),
      expiration_date: localDate(2026, 1, 15),
      interval: SubscriptionInterval.MONTHLY,
      period: 3,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2025)
    expect(result!.getMonth()).toBe(3) // April
    expect(result!.getDate()).toBe(15)
  })

  it("yearly with period=2 advances by 2 years", () => {
    const result = service.getNextOrderDate({
      last_order_date: localDate(2025, 1, 1),
      expiration_date: localDate(2035, 1, 1),
      interval: SubscriptionInterval.YEARLY,
      period: 2,
    })

    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2027)
  })
})
