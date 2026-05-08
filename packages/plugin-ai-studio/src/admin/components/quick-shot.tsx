import { Photo } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useCallback, useRef, useState } from "react"
import { sdk } from "../lib/sdk"

interface GeneratedImage {
  base64: string
  mimeType: string
  url?: string
  prompt: string
  timestamp: number
}

interface GenerateResponse {
  image: { base64: string; mimeType: string; url?: string }
  selfReport?: string
}

export const QuickShot = () => {
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<"flash" | "pro">("flash")
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [selfReport, setSelfReport] = useState<string | null>(null)
  const [reportExpanded, setReportExpanded] = useState(false)
  const [saveHandle, setSaveHandle] = useState("")
  const [saving, setSaving] = useState(false)
  const [gallery, setGallery] = useState<GeneratedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        // dataUrl = "data:<mime>;base64,<data>"
        const base64 = dataUrl.split(",")[1]
        setReferenceBase64(base64)
        setReferencePreview(dataUrl)
      }
      reader.readAsDataURL(file)
    },
    []
  )

  const clearReference = useCallback(() => {
    setReferenceBase64(null)
    setReferencePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Error", { description: "Please enter a prompt." })
      return
    }
    setLoading(true)
    setSelfReport(null)
    setReportExpanded(false)
    try {
      const body: Record<string, unknown> = { prompt, model }
      if (referenceBase64) body.referenceImage = referenceBase64

      const data = await sdk.client.fetch<GenerateResponse>(
        "/admin/ai-studio",
        { method: "POST", body }
      )

      const img: GeneratedImage = {
        base64: data.image.base64,
        mimeType: data.image.mimeType,
        url: data.image.url,
        prompt,
        timestamp: Date.now(),
      }
      setCurrentImage(img)
      setGallery((prev) => [img, ...prev])
      if (data.selfReport) setSelfReport(data.selfReport)
      toast.success("Image generated", {
        description: `Generated with ${model} model.`,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Image generation failed."
      toast.error("Generation failed", { description: message })
    } finally {
      setLoading(false)
    }
  }, [prompt, model, referenceBase64])

  const handleSave = useCallback(async () => {
    if (!currentImage) return
    if (!saveHandle.trim()) {
      toast.error("Error", { description: "Enter a product handle." })
      return
    }
    setSaving(true)
    try {
      await sdk.client.fetch("/admin/ai-studio", {
        method: "POST",
        body: {
          prompt: currentImage.prompt,
          model,
          saveToProduct: saveHandle.trim(),
        },
      })
      toast.success("Saved", {
        description: `Image saved to product "${saveHandle.trim()}".`,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save image."
      toast.error("Save failed", { description: message })
    } finally {
      setSaving(false)
    }
  }, [currentImage, saveHandle, model])

  return (
    <div className="flex flex-col gap-y-4">
      {/* Two-column layout: controls + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: inputs */}
        <Container>
          <Heading level="h2" className="mb-4">
            Generate Image
          </Heading>

          {/* Prompt */}
          <div className="flex flex-col gap-y-1 mb-4">
            <Label htmlFor="qs-prompt">Prompt</Label>
            <textarea
              id="qs-prompt"
              className="w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive min-h-[120px] resize-y"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Model selector */}
          <div className="flex flex-col gap-y-1 mb-4">
            <Label htmlFor="qs-model">Model</Label>
            <select
              id="qs-model"
              className="w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
              value={model}
              onChange={(e) => setModel(e.target.value as "flash" | "pro")}
            >
              <option value="flash">Gemini Flash (fast)</option>
              <option value="pro">Gemini Pro (quality)</option>
            </select>
          </div>

          {/* Reference image */}
          <div className="flex flex-col gap-y-1 mb-4">
            <Label htmlFor="qs-ref">Reference Image (optional)</Label>
            <input
              ref={fileInputRef}
              id="qs-ref"
              type="file"
              accept="image/jpeg,image/png"
              className="text-sm text-ui-fg-base file:mr-3 file:rounded-lg file:border-0 file:bg-ui-bg-interactive file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ui-fg-on-color hover:file:cursor-pointer"
              onChange={handleFileSelect}
            />
            {referencePreview && (
              <div className="mt-2 flex items-start gap-2">
                <img
                  src={referencePreview}
                  alt="Reference preview"
                  className="h-20 w-20 rounded-lg border border-ui-border-base object-cover"
                />
                <Button
                  variant="secondary"
                  size="small"
                  onClick={clearReference}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Generate button */}
          <Button
            variant="primary"
            onClick={handleGenerate}
            isLoading={loading}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            Generate
          </Button>
        </Container>

        {/* Right column: generated image */}
        <Container>
          <Heading level="h2" className="mb-4">
            Preview
          </Heading>
          {currentImage ? (
            <img
              src={`data:${currentImage.mimeType};base64,${currentImage.base64}`}
              alt={currentImage.prompt}
              className="w-full rounded-lg border border-ui-border-base"
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle py-16">
              <Photo className="text-ui-fg-muted mb-2" />
              <Text className="text-ui-fg-muted text-sm">
                Generated image will appear here
              </Text>
            </div>
          )}
        </Container>
      </div>

      {/* Self-report */}
      {selfReport && (
        <Container>
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setReportExpanded((v) => !v)}
          >
            <Heading level="h2">Self Report</Heading>
            <Text className="text-ui-fg-muted text-sm">
              {reportExpanded ? "Collapse" : "Expand"}
            </Text>
          </button>
          {reportExpanded && (
            <Text className="mt-2 whitespace-pre-wrap text-sm text-ui-fg-subtle">
              {selfReport}
            </Text>
          )}
        </Container>
      )}

      {/* Save to product */}
      {currentImage && (
        <Container>
          <Heading level="h2" className="mb-4">
            Save to Product
          </Heading>
          <div className="flex gap-x-2">
            <div className="flex-1">
              <Input
                placeholder="Product handle (e.g. my-product)"
                value={saveHandle}
                onChange={(e) => setSaveHandle(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleSave}
              isLoading={saving}
              disabled={saving || !saveHandle.trim()}
            >
              Save
            </Button>
          </div>
        </Container>
      )}

      {/* Session gallery */}
      {gallery.length > 1 && (
        <Container>
          <Heading level="h2" className="mb-4">
            Session Gallery
          </Heading>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((img) => (
              <button
                key={img.timestamp}
                className={`rounded-lg border overflow-hidden transition-all ${
                  currentImage?.timestamp === img.timestamp
                    ? "border-ui-fg-interactive ring-2 ring-ui-fg-interactive"
                    : "border-ui-border-base hover:border-ui-fg-subtle"
                }`}
                onClick={() => {
                  setCurrentImage(img)
                  setPrompt(img.prompt)
                }}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={img.prompt}
                  className="w-full aspect-square object-cover"
                />
              </button>
            ))}
          </div>
        </Container>
      )}
    </div>
  )
}
