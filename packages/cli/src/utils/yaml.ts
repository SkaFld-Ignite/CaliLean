import { readFileSync, writeFileSync } from "fs"
import { parse, stringify } from "yaml"
import { CaliLeanConfigSchema, CaliLeanConfig } from "../schema/config"
import { log } from "./logger"

export function loadConfig(path: string): CaliLeanConfig {
  let raw: string
  try {
    raw = readFileSync(path, "utf-8")
  } catch {
    throw new Error(`Config file not found: ${path}`)
  }
  const parsed = parse(raw)
  const result = CaliLeanConfigSchema.safeParse(parsed)
  if (!result.success) {
    log.error("Config validation failed:")
    for (const issue of result.error.issues) {
      log.error(`  ${issue.path.join(".")}: ${issue.message}`)
    }
    throw new Error("Invalid config file")
  }
  return result.data
}

export function writeConfig(path: string, config: CaliLeanConfig): void {
  const content = stringify(config, { indent: 2, lineWidth: 120 })
  writeFileSync(path, content, "utf-8")
  log.success(`Config written to ${path}`)
}
