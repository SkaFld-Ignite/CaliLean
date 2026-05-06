import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Label,
  Select,
  Text,
  Toaster,
  toast
} from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

const ASPECT_RATIOS = [
  { label: "1:1 Square", value: "1:1" },
  { label: "16:9 Landscape", value: "16:9" },
  { label: "9:16 Portrait", value: "9:16" },
  { label: "4:3 Classic", value: "4:3" },
  { label: "3:4 Tall", value: "3:4" },
]

const MODELS = [
  { label: "Standard", value: "standard" },
  { label: "Fast", value: "fast" },
  { label: "Ultra", value: "ultra" },
]

const AiStudioPage = () => {
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [model, setModel] = useState("standard")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<{ base64: string; mimeType: string } | null>(null)
  const [gallery, setGallery] = useState<{ base64: string; mimeType: string; prompt: string }[]>([])

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt")
      return
    }

    setIsGenerating(true)
    try {
      const response = await sdk.client.fetch<{ image: { base64: string; mimeType: string } }>(
        "/admin/ai-studio",
        {
          method: "POST",
          body: { prompt, aspectRatio, model },
        }
      )

      if (response.image) {
        setGeneratedImage(response.image)
        setGallery((prev) => [{ ...response.image, prompt }, ...prev])
        toast.success("Image generated successfully")
      }
    } catch (error) {
      toast.error("Failed to generate image")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container>
        <div className="flex flex-col gap-y-8">
          <Heading>AI Studio Workspace</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[120px] w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-border-interactive"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <Select.Trigger><Select.Value /></Select.Trigger>
                    <Select.Content>
                      {ASPECT_RATIOS.map((item) => (
                        <Select.Item key={item.value} value={item.value}>{item.label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <Select.Trigger><Select.Value /></Select.Trigger>
                    <Select.Content>
                      {MODELS.map((item) => (
                        <Select.Item key={item.value} value={item.value}>{item.label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerate} isLoading={isGenerating}>Generate Image</Button>
            </div>
            <div className="flex items-center justify-center border-2 border-dashed border-ui-border-base rounded-lg min-h-[300px] bg-ui-bg-subtle overflow-hidden">
              {generatedImage ? (
                <img src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-y-2 text-ui-fg-muted">
                  <Photo /><Text>Your generated image will appear here</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
      {gallery.length > 0 && (
        <Container>
          <Heading level="h2">Gallery</Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {gallery.map((item, index) => (
              <div key={index} className="group relative aspect-square rounded-md overflow-hidden bg-ui-bg-subtle border border-ui-border-base">
                <img src={`data:${item.mimeType};base64,${item.base64}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </div>
            ))}
          </div>
        </Container>
      )}
      <Toaster />
    </div>
  )
}

export const config = defineRouteConfig({ label: "AI Studio", icon: Photo, path: "/ai-studio" })
export default AiStudioPage
