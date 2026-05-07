import { ViewType, PromptVariables } from "../lib/types"
import { NB2_PREAMBLE } from "./preamble"
import { SYSTEM_BLOCK } from "./system-block"
import { GUARD_RAILS } from "./guard-rails"
import { VIEW_TEMPLATES } from "./templates"

function fillTemplate(template: string, vars: PromptVariables): string {
  return template
    .replace(/\{COMPOUND\}/g, vars.COMPOUND)
    .replace(/\{DOSAGE\}/g, vars.DOSAGE)
    .replace(/\{LOT\}/g, vars.LOT)
    .replace(/\{CAP_COLOR_NAME\}/g, vars.CAP_COLOR_NAME)
    .replace(/\{CAP_HEX\}/g, vars.CAP_HEX)
    .replace(/\{ACCENT_COLOR_NAME\}/g, vars.ACCENT_COLOR_NAME)
    .replace(/\{ACCENT_HEX\}/g, vars.ACCENT_HEX)
    .replace(/\{BOX_HEX\}/g, vars.BOX_HEX)
    .replace(/\{FORM_INSIDE\}/g, vars.FORM_INSIDE)
    .replace(/\{FORM_TEXT\}/g, vars.FORM_TEXT)
}

export function buildProductPrompt(view: ViewType, vars: PromptVariables): string {
  const template = VIEW_TEMPLATES[view]
  const filled = fillTemplate(template, vars)
  return [NB2_PREAMBLE, "", SYSTEM_BLOCK, "", filled, "", GUARD_RAILS].join("\n")
}

export function buildQuickShotPrompt(userPrompt: string): string {
  return [NB2_PREAMBLE, "", SYSTEM_BLOCK, "", userPrompt, "", GUARD_RAILS].join("\n")
}
