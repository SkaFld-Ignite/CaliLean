export type ViewType =
  | "A_vial_front"
  | "B_vial_back"
  | "C_flat_label"
  | "D_box_assembled"
  | "E_box_dieline"

export const ALL_VIEWS: ViewType[] = [
  "A_vial_front",
  "B_vial_back",
  "C_flat_label",
  "D_box_assembled",
  "E_box_dieline",
]

export const VIEW_LABELS: Record<ViewType, string> = {
  A_vial_front: "Vial Front",
  B_vial_back: "Vial Back",
  C_flat_label: "Flat Label",
  D_box_assembled: "Box Assembled",
  E_box_dieline: "Box Dieline",
}

export type NB2Model = "flash" | "pro"

export const MODEL_IDS: Record<NB2Model, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
}

export interface NB2ColorConfig {
  capColor: string
  capColorName: string
  accentColor: string
  accentColorName: string
  boxColor: string
  formInside: string
  formText: string
}

export const DEFAULT_COLOR_CONFIG: NB2ColorConfig = {
  capColor: "#8B9298",
  capColorName: "Muted Gray",
  accentColor: "#8B9298",
  accentColorName: "Muted Gray",
  boxColor: "#6B8399",
  formInside: "clear liquid",
  formText: "Lyophilized Powder",
}

export interface PromptVariables {
  COMPOUND: string
  DOSAGE: string
  LOT: string
  CAP_COLOR_NAME: string
  CAP_HEX: string
  ACCENT_COLOR_NAME: string
  ACCENT_HEX: string
  BOX_HEX: string
  FORM_INSIDE: string
  FORM_TEXT: string
}

export interface GeminiResult {
  imageBytes: Buffer
  mimeType: string
  selfReport?: string
}

export interface ShootResult {
  view: ViewType
  url: string
  selfReport: string
}
