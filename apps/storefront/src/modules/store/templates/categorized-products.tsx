import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import ProductPreview from "@modules/products/components/product-preview"
import { HttpTypes } from "@medusajs/types"

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Recovery:
    "Peptides studied in tendon, ligament, and gut-tissue repair models.",
  "Weight Management":
    "Multi-receptor agonists studied in metabolic pathway research.",
  "Growth & Anti-Aging":
    "Secretagogue compounds targeting the growth-hormone release axis.",
  Longevity:
    "Compounds studied in cellular metabolism, oxidative stress, and mitochondrial function.",
  Cosmetic: "Peptides studied in skin, hair, and pigmentation research.",
  Supplies: "Reconstitution and preparation essentials.",
}

export default async function CategorizedProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const [
    categories,
    {
      response: { products: allProducts },
    },
  ] = await Promise.all([
    listCategories(),
    getProductsListWithSort({
      page: 1,
      queryParams: {
        limit: 100,
        fields: "*variants.calculated_price,+categories.*",
        status: ["published"] as any,
      },
      sortBy: "created_at",
      countryCode,
    }),
  ])

  // Guard: only show published products (belt-and-suspenders against cache/API drift)
  const products = allProducts.filter((p: any) => p.status === "published")

  // Find top-level categories and their children
  const topLevel = categories.filter((c: any) => !c.parent_category_id)

  // Build a flat list of display categories:
  // If a top-level category has children, show the children as sections
  // If it has no children (e.g. Supplies), show it directly
  const displayCategories: { id: string; name: string; description: string }[] =
    []

  for (const parent of topLevel) {
    const children = (parent as any).category_children || []
    if (children.length > 0) {
      for (const child of children) {
        displayCategories.push({
          id: child.id,
          name: child.name,
          description: CATEGORY_DESCRIPTIONS[child.name] || "",
        })
      }
    } else {
      displayCategories.push({
        id: parent.id,
        name: parent.name,
        description: CATEGORY_DESCRIPTIONS[parent.name] || "",
      })
    }
  }

  // Map products by their category IDs
  const productsByCategoryId = new Map<string, HttpTypes.StoreProduct[]>()
  for (const product of products) {
    const cats = (product as any).categories || []
    for (const cat of cats) {
      const existing = productsByCategoryId.get(cat.id) || []
      existing.push(product)
      productsByCategoryId.set(cat.id, existing)
    }
  }

  return (
    <div className="flex flex-col gap-16">
      {displayCategories.map((category) => {
        const categoryProducts = productsByCategoryId.get(category.id) || []

        if (categoryProducts.length === 0) return null

        return (
          <section key={category.id}>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-normal text-calilean-ink">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-calilean-fog mt-1">
                  {category.description}
                </p>
              )}
            </div>
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
              {categoryProducts
                .filter((p: any) => p.status === "published")
                .map((p) => (
                  <li key={p.id}>
                    <ProductPreview product={p} region={region} />
                  </li>
                ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
