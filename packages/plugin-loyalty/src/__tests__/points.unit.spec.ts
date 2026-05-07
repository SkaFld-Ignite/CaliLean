import LoyaltyModuleService from "../modules/loyalty/service"
import {
  getCartLoyaltyPromotion,
  orderHasLoyaltyPromotion,
  CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE,
} from "../utils/promo"
import type { CartData, OrderData } from "../utils/promo"

// ---------------------------------------------------------------------------
// calculatePointsFromAmount — pure function on the service class
// ---------------------------------------------------------------------------

function createService(): LoyaltyModuleService {
  return Object.create(LoyaltyModuleService.prototype)
}

describe("LoyaltyModuleService.calculatePointsFromAmount", () => {
  const service = createService()

  it("converts $1 to 1 point", async () => {
    expect(await service.calculatePointsFromAmount(1)).toBe(1)
  })

  it("rounds down fractional amounts", async () => {
    expect(await service.calculatePointsFromAmount(49.99)).toBe(49)
  })

  it("returns 0 for zero amount", async () => {
    expect(await service.calculatePointsFromAmount(0)).toBe(0)
  })

  it("returns 0 for amounts less than 1", async () => {
    expect(await service.calculatePointsFromAmount(0.5)).toBe(0)
  })

  it("handles large amounts", async () => {
    expect(await service.calculatePointsFromAmount(99999)).toBe(99999)
  })

  it("throws on negative amounts", async () => {
    await expect(service.calculatePointsFromAmount(-10)).rejects.toThrow(
      "Amount cannot be negative"
    )
  })

  it("throws on large negative amounts", async () => {
    await expect(service.calculatePointsFromAmount(-0.01)).rejects.toThrow(
      "Amount cannot be negative"
    )
  })
})

// ---------------------------------------------------------------------------
// getCartLoyaltyPromotion — pure utility function
// ---------------------------------------------------------------------------

describe("getCartLoyaltyPromotion", () => {
  it("returns the matching promotion from cart", () => {
    const cart: CartData = {
      metadata: { loyalty_promo_id: "promo_123" },
      promotions: [
        { id: "promo_456" } as any,
        { id: "promo_123" } as any,
      ],
    } as any

    const result = getCartLoyaltyPromotion(cart)
    expect(result).toBeDefined()
    expect(result!.id).toBe("promo_123")
  })

  it("returns undefined when no loyalty_promo_id in metadata", () => {
    const cart: CartData = {
      metadata: {},
      promotions: [{ id: "promo_456" } as any],
    } as any

    expect(getCartLoyaltyPromotion(cart)).toBeUndefined()
  })

  it("returns undefined when cart has no promotions array", () => {
    const cart: CartData = {
      metadata: { loyalty_promo_id: "promo_123" },
    } as any

    expect(getCartLoyaltyPromotion(cart)).toBeUndefined()
  })

  it("returns undefined when promo id not found in promotions", () => {
    const cart: CartData = {
      metadata: { loyalty_promo_id: "promo_999" },
      promotions: [{ id: "promo_456" } as any],
    } as any

    expect(getCartLoyaltyPromotion(cart)).toBeUndefined()
  })

  it("returns undefined for null cart", () => {
    expect(getCartLoyaltyPromotion(null as any)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// orderHasLoyaltyPromotion — pure utility function
// ---------------------------------------------------------------------------

describe("orderHasLoyaltyPromotion", () => {
  function makeOrderWithPromo(opts: {
    promoId: string
    customerId: string
    ruleCustomerId: string
    ruleAttribute?: string
  }): OrderData {
    return {
      customer: { id: opts.customerId } as any,
      cart: {
        metadata: { loyalty_promo_id: opts.promoId },
        promotions: [
          {
            id: opts.promoId,
            rules: [
              {
                attribute: opts.ruleAttribute || CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE,
                values: [{ value: opts.ruleCustomerId }],
              },
            ],
          },
        ],
      } as any,
    } as any
  }

  it("returns true when order cart has a loyalty promo matching the customer", () => {
    const order = makeOrderWithPromo({
      promoId: "promo_123",
      customerId: "cust_abc",
      ruleCustomerId: "cust_abc",
    })

    expect(orderHasLoyaltyPromotion(order)).toBe(true)
  })

  it("returns false when customer id does not match the rule", () => {
    const order = makeOrderWithPromo({
      promoId: "promo_123",
      customerId: "cust_abc",
      ruleCustomerId: "cust_OTHER",
    })

    expect(orderHasLoyaltyPromotion(order)).toBe(false)
  })

  it("returns false when rule attribute is not customer_id", () => {
    const order = makeOrderWithPromo({
      promoId: "promo_123",
      customerId: "cust_abc",
      ruleCustomerId: "cust_abc",
      ruleAttribute: "some_other_attribute",
    })

    expect(orderHasLoyaltyPromotion(order)).toBe(false)
  })

  it("returns false when no cart is present", () => {
    const order = { customer: { id: "cust_abc" } } as any
    expect(orderHasLoyaltyPromotion(order)).toBe(false)
  })

  it("returns false when no loyalty promo in cart metadata", () => {
    const order = {
      customer: { id: "cust_abc" },
      cart: { metadata: {}, promotions: [] },
    } as any

    expect(orderHasLoyaltyPromotion(order)).toBe(false)
  })

  it("returns false when promotions have no rules", () => {
    const order = {
      customer: { id: "cust_abc" },
      cart: {
        metadata: { loyalty_promo_id: "promo_123" },
        promotions: [{ id: "promo_123", rules: [] }],
      },
    } as any

    expect(orderHasLoyaltyPromotion(order)).toBe(false)
  })
})
