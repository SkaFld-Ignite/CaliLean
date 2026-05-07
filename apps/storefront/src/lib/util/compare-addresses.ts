import { isEqual, pick } from "lodash"
import { HttpTypes } from "@medusajs/types"

type Address = HttpTypes.StoreCartAddress | HttpTypes.StoreCustomerAddress | null | undefined

export default function compareAddresses(address1: Address, address2: Address) {
  return isEqual(
    pick(address1, [
      "first_name",
      "last_name",
      "address_1",
      "company",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ]),
    pick(address2, [
      "first_name",
      "last_name",
      "address_1",
      "company",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ])
  )
}
