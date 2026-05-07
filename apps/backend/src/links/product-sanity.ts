import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import { SANITY_MODULE } from "../modules/sanity";
import { SANITY_API_TOKEN } from "../lib/constants";

// Only register the link when Sanity is configured.
// Medusa auto-scans src/links/ and crashes on undefined exports,
// so when SANITY_API_TOKEN is absent we still export a valid link
// using a placeholder that will never be queried (the Sanity module
// itself is not loaded without the token).
export default defineLink(
  {
    linkable: ProductModule.linkable.product.id,
    field: "id",
  },
  {
    linkable: {
      serviceName: SANITY_MODULE,
      alias: "sanity_product",
      primaryKey: "id",
    },
  },
  {
    readOnly: true,
  }
);
