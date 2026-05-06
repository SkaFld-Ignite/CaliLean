import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: window.location.origin,
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "session",
  },
})
