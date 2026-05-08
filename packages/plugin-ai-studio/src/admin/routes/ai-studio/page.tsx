import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Container, Heading, Toaster } from "@medusajs/ui"
import { useState } from "react"
import { QuickShot } from "../../components/quick-shot"
import { ProductShoot } from "../../components/product-shoot"

const TABS = [
  { id: "quick-shot", label: "Quick Shot" },
  { id: "product-shoot", label: "Product Shoot" },
] as const

const AiStudioPage = () => {
  const [activeTab, setActiveTab] = useState<string>("quick-shot")

  return (
    <div className="flex flex-col gap-y-4">
      <Container>
        <Heading>AI Studio</Heading>
        <div className="flex gap-x-2 mt-4 border-b border-ui-border-base">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-ui-fg-base text-ui-fg-base"
                  : "border-transparent text-ui-fg-muted hover:text-ui-fg-subtle"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Container>

      {activeTab === "quick-shot" && <QuickShot />}
      {activeTab === "product-shoot" && <ProductShoot />}

      <Toaster />
    </div>
  )
}

export const config = defineRouteConfig({ label: "AI Studio", icon: Photo })
export default AiStudioPage
