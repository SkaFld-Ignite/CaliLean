import {
  mapOrderToSalesReceipt,
  mapOrderToInvoice,
  mapCustomerToQbo,
  mapProductToQboItem,
  mapDisputeToRefundReceipt,
} from "../providers/quickbooks/mappers"

import {
  mapOrderToSalesInvoice,
  mapCustomerToErpNext,
  mapProductToErpNextItem,
} from "../providers/erpnext/mappers"

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeOrder(overrides: Record<string, unknown> = {}): any {
  return {
    id: "order_abc123",
    display_id: 1042,
    created_at: "2025-06-15T14:30:00.000Z",
    currency_code: "usd",
    items: [
      {
        title: "CBD Tincture 1000mg",
        subtitle: "Full Spectrum",
        quantity: 2,
        unit_price: 4999,
        total: 9998,
        variant_sku: "CBD-TINC-1000",
        product_handle: "cbd-tincture-1000mg",
      },
    ],
    shipping_total: 0,
    ...overrides,
  }
}

function makeCustomer(overrides: Record<string, unknown> = {}): any {
  return {
    id: "cust_xyz",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
    phone: "+15551234567",
    ...overrides,
  }
}

function makeProduct(overrides: Record<string, unknown> = {}): any {
  return {
    id: "prod_001",
    title: "CBD Gummies 30ct",
    variants: [{ sku: "CBD-GUM-30" }],
    ...overrides,
  }
}

// ===========================================================================
// QuickBooks mapper tests
// ===========================================================================

describe("QuickBooks mappers", () => {
  // ── mapOrderToSalesReceipt (CC / captured payments) ───────────────────
  describe("mapOrderToSalesReceipt", () => {
    it("maps a basic order to a QBO SalesReceipt", () => {
      const result = mapOrderToSalesReceipt(makeOrder())

      expect(result.TxnDate).toBe("2025-06-15")
      expect(result.CurrencyRef.value).toBe("USD")
      expect(result.Line).toHaveLength(1)
      expect(result.Line[0].Amount).toBe(9998)
      expect(result.Line[0].SalesItemLineDetail!.Qty).toBe(2)
      expect(result.Line[0].SalesItemLineDetail!.UnitPrice).toBe(4999)
      expect(result.Line[0].Description).toBe("CBD Tincture 1000mg")
      expect(result.PrivateNote).toContain("1042")
      expect(result.PrivateNote).toContain("order_abc123")
    })

    it("defaults currency to USD when missing", () => {
      const result = mapOrderToSalesReceipt(makeOrder({ currency_code: undefined }))
      expect(result.CurrencyRef.value).toBe("USD")
    })

    it("handles an order with no items gracefully", () => {
      const result = mapOrderToSalesReceipt(makeOrder({ items: [] }))
      expect(result.Line).toEqual([])
    })

    it("handles null items array", () => {
      const result = mapOrderToSalesReceipt(makeOrder({ items: null }))
      expect(result.Line).toEqual([])
    })
  })

  // ── mapOrderToInvoice (ACH / pending settlement) ──────────────────────
  describe("mapOrderToInvoice", () => {
    it("maps an order to a QBO Invoice with a 7-day due date", () => {
      const result = mapOrderToInvoice(makeOrder())

      expect(result.TxnDate).toBe("2025-06-15")
      expect(result.DueDate).toBe("2025-06-22")
      expect(result.PrivateNote).toContain("ACH pending settlement")
    })

    it("correctly rolls due date across month boundary", () => {
      const result = mapOrderToInvoice(
        makeOrder({ created_at: "2025-01-28T00:00:00.000Z" })
      )
      expect(result.DueDate).toBe("2025-02-04")
    })

    it("invoice line items match sales receipt format", () => {
      const invoice = mapOrderToInvoice(makeOrder())
      const receipt = mapOrderToSalesReceipt(makeOrder())

      expect(invoice.Line).toEqual(receipt.Line)
    })
  })

  // ── mapCustomerToQbo ──────────────────────────────────────────────────
  describe("mapCustomerToQbo", () => {
    it("maps a customer with full name", () => {
      const result = mapCustomerToQbo(makeCustomer())

      expect(result.DisplayName).toBe("Jane Doe")
      expect(result.PrimaryEmailAddr).toEqual({ Address: "jane@example.com" })
      expect(result.PrimaryPhone).toEqual({ FreeFormNumber: "+15551234567" })
      expect(result.Active).toBe(true)
    })

    it("falls back to email when name fields are missing", () => {
      const result = mapCustomerToQbo(
        makeCustomer({ first_name: null, last_name: null })
      )
      expect(result.DisplayName).toBe("jane@example.com")
    })

    it("omits phone and email when not provided", () => {
      const result = mapCustomerToQbo(
        makeCustomer({ email: undefined, phone: undefined })
      )
      expect(result.PrimaryEmailAddr).toBeUndefined()
      expect(result.PrimaryPhone).toBeUndefined()
    })
  })

  // ── mapProductToQboItem ───────────────────────────────────────────────
  describe("mapProductToQboItem", () => {
    it("maps a product to a NonInventory QBO item", () => {
      const result = mapProductToQboItem(makeProduct())

      expect(result.Name).toBe("CBD Gummies 30ct")
      expect(result.Sku).toBe("CBD-GUM-30")
      expect(result.Type).toBe("NonInventory")
      expect(result.Active).toBe(true)
    })

    it("truncates product name to 100 characters", () => {
      const longTitle = "A".repeat(150)
      const result = mapProductToQboItem(makeProduct({ title: longTitle }))
      expect(result.Name).toHaveLength(100)
    })

    it("handles product with no variants", () => {
      const result = mapProductToQboItem(makeProduct({ variants: [] }))
      expect(result.Sku).toBeUndefined()
    })
  })

  // ── mapDisputeToRefundReceipt ─────────────────────────────────────────
  describe("mapDisputeToRefundReceipt", () => {
    it("converts dispute amount from cents to dollars", () => {
      const result = mapDisputeToRefundReceipt({
        amount: 5000,
        currency_code: "usd",
        order_external_id: "SR-1001",
        customer_external_id: "42",
        reason: "Product not received",
      })

      expect(result.Line[0].Amount).toBe(50)
      expect(result.Line[0].SalesItemLineDetail!.UnitPrice).toBe(50)
      expect(result.Line[0].Description).toBe("Dispute: Product not received")
      expect(result.CustomerRef.value).toBe("42")
      expect(result.CurrencyRef.value).toBe("USD")
      expect(result.PrivateNote).toContain("SR-1001")
    })

    it("defaults customer ref to 1 when no external id", () => {
      const result = mapDisputeToRefundReceipt({
        amount: 1000,
        currency_code: "usd",
        order_external_id: "SR-99",
        reason: "Chargeback",
      })

      expect(result.CustomerRef.value).toBe("1")
    })
  })
})

// ===========================================================================
// ERPNext mapper tests
// ===========================================================================

describe("ERPNext mappers", () => {
  const erpOpts = {
    company: "Bluum LLC",
    income_account: "4000 - Revenue",
    debit_account: "1100 - Accounts Receivable",
  }

  describe("mapOrderToSalesInvoice", () => {
    it("maps an order to an ERPNext Sales Invoice", () => {
      const result = mapOrderToSalesInvoice(makeOrder(), "Jane Doe", erpOpts) as any

      expect(result.doctype).toBe("Sales Invoice")
      expect(result.company).toBe("Bluum LLC")
      expect(result.customer).toBe("Jane Doe")
      expect(result.posting_date).toBe("2025-06-15")
      expect(result.currency).toBe("USD")
      expect(result.custom_medusa_order_id).toBe("order_abc123")
      expect(result.remarks).toContain("1042")
      expect(result.items).toHaveLength(1)
      expect(result.items[0].item_code).toBe("CBD-TINC-1000")
      expect(result.items[0].qty).toBe(2)
      expect(result.items[0].income_account).toBe("4000 - Revenue")
    })

    it("sets due date 30 days after posting date", () => {
      const result = mapOrderToSalesInvoice(makeOrder(), "Jane Doe", erpOpts) as any
      expect(result.due_date).toBe("2025-07-15")
    })

    it("includes shipping as a line item when shipping_total > 0", () => {
      const result = mapOrderToSalesInvoice(
        makeOrder({ shipping_total: 999 }),
        "Jane Doe",
        erpOpts
      ) as any

      expect(result.items).toHaveLength(2)
      const shippingLine = result.items.find((i: any) => i.item_code === "Shipping")
      expect(shippingLine).toBeDefined()
      expect(shippingLine.amount).toBe(999)
    })

    it("omits shipping line when shipping_total is 0", () => {
      const result = mapOrderToSalesInvoice(makeOrder(), "Jane Doe", erpOpts) as any
      expect(result.items.every((i: any) => i.item_code !== "Shipping")).toBe(true)
    })

    it("builds description with subtitle when present", () => {
      const result = mapOrderToSalesInvoice(makeOrder(), "Jane Doe", erpOpts) as any
      expect(result.items[0].description).toBe("CBD Tincture 1000mg — Full Spectrum")
    })

    it("falls back to product_handle then title for item_code", () => {
      const order = makeOrder({
        items: [
          { title: "Mystery Item", quantity: 1, unit_price: 100, total: 100 },
        ],
      })
      const result = mapOrderToSalesInvoice(order, "Jane Doe", erpOpts) as any
      expect(result.items[0].item_code).toBe("Mystery Item")
    })
  })

  describe("mapCustomerToErpNext", () => {
    it("maps a customer to an ERPNext Customer doctype", () => {
      const result = mapCustomerToErpNext(makeCustomer()) as any

      expect(result.doctype).toBe("Customer")
      expect(result.customer_name).toBe("Jane Doe")
      expect(result.customer_type).toBe("Individual")
      expect(result.email_id).toBe("jane@example.com")
      expect(result.custom_medusa_customer_id).toBe("cust_xyz")
    })

    it("falls back to email when name is missing", () => {
      const result = mapCustomerToErpNext(
        makeCustomer({ first_name: null, last_name: null })
      ) as any
      expect(result.customer_name).toBe("jane@example.com")
    })
  })

  describe("mapProductToErpNextItem", () => {
    it("maps a product to an ERPNext Item doctype", () => {
      const result = mapProductToErpNextItem(makeProduct()) as any

      expect(result.doctype).toBe("Item")
      expect(result.item_name).toBe("CBD Gummies 30ct")
      expect(result.item_code).toBe("CBD-GUM-30")
      expect(result.item_group).toBe("Products")
      expect(result.custom_medusa_product_id).toBe("prod_001")
    })

    it("uses product id when no variant SKU exists", () => {
      const result = mapProductToErpNextItem(
        makeProduct({ variants: [] })
      ) as any
      expect(result.item_code).toBe("prod_001")
    })
  })
})

// ===========================================================================
// CC vs ACH payment detection logic (from sync-order-to-erp workflow)
// ===========================================================================

describe("CC vs ACH payment detection logic", () => {
  // This logic lives in a workflow transform, so we replicate it here to
  // verify correctness without needing the workflow runtime.
  function detectPaymentAction(order: any): string | null {
    const payments = order.payment_collections?.[0]?.payments || []
    const isPaymentCaptured = payments.some(
      (p: any) => p.captured_at != null
    )

    if (isPaymentCaptured) {
      return "createSalesReceipt"
    } else {
      return "createInvoice"
    }
  }

  it("returns createSalesReceipt when payment is captured (CC)", () => {
    const order = {
      payment_collections: [
        {
          payments: [
            { captured_at: "2025-06-15T14:35:00Z", provider_id: "stripe" },
          ],
        },
      ],
    }
    expect(detectPaymentAction(order)).toBe("createSalesReceipt")
  })

  it("returns createInvoice when payment is authorized but not captured (ACH)", () => {
    const order = {
      payment_collections: [
        {
          payments: [
            { captured_at: null, provider_id: "nmi" },
          ],
        },
      ],
    }
    expect(detectPaymentAction(order)).toBe("createInvoice")
  })

  it("returns createInvoice when no payments exist", () => {
    const order = { payment_collections: [{ payments: [] }] }
    expect(detectPaymentAction(order)).toBe("createInvoice")
  })

  it("returns createSalesReceipt if ANY payment is captured", () => {
    const order = {
      payment_collections: [
        {
          payments: [
            { captured_at: null, provider_id: "nmi" },
            { captured_at: "2025-06-15T14:35:00Z", provider_id: "stripe" },
          ],
        },
      ],
    }
    expect(detectPaymentAction(order)).toBe("createSalesReceipt")
  })

  it("handles missing payment_collections gracefully", () => {
    expect(detectPaymentAction({})).toBe("createInvoice")
  })
})
