import { GeminiResult, MODEL_IDS, NB2Model } from "./types"

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export async function callGemini(args: {
  prompt: string
  apiKey: string
  model?: NB2Model
  referenceImage?: Buffer
}): Promise<GeminiResult> {
  const { prompt, apiKey, model = "flash", referenceImage } = args
  const modelId = MODEL_IDS[model]
  const url = `${API_BASE}/${modelId}:streamGenerateContent?key=${apiKey}`

  const parts: Array<Record<string, unknown>> = []

  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: referenceImage.toString("base64"),
      },
    })
  }

  parts.push({ text: prompt })

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const json = (await response.json()) as Array<{
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string
          inlineData?: { mimeType: string; data: string }
        }>
      }
    }>
  }>

  let imageBytes: Buffer | null = null
  let mimeType = "image/jpeg"
  let selfReport = ""

  for (const chunk of json) {
    for (const candidate of chunk.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          imageBytes = Buffer.from(part.inlineData.data, "base64")
          mimeType = part.inlineData.mimeType || "image/jpeg"
        }
        if (part.text) {
          selfReport += part.text
        }
      }
    }
  }

  if (!imageBytes) {
    throw new Error("No image data found in Gemini response")
  }

  return { imageBytes, mimeType, selfReport: selfReport.trim() || undefined }
}
