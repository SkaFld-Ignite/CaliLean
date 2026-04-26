// The Medusa 2.x StoreCart HTTP type omits `completed_at`, but the API does
// return it (see CartDTO in @medusajs/types/dist/cart/common.d.ts). Augment
// StoreCart so checkout-flow code can read it without casting.
declare module "@medusajs/types/dist/http/cart/store/entities" {
  interface StoreCart {
    completed_at?: string | Date | null
  }
}

export {}
