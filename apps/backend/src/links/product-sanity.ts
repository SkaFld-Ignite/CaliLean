import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import { SANITY_MODULE } from "../modules/sanity";
import { SANITY_API_TOKEN } from "../lib/constants";

// Conditional: the Sanity module is only loaded when SANITY_API_TOKEN is set.
// The link must also be conditional to avoid referencing a missing module.
const link = SANITY_API_TOKEN
  ? defineLink(
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
    )
  : undefined;

export default link;
