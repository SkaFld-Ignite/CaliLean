import { resolveFromDoppler } from "./doppler"
import { log } from "../utils/logger"

export interface Credentials {
  url: string
  email: string
  password: string
}

interface AuthFlags {
  url?: string
  email?: string
  password?: string
  env?: string
}

const DEFAULTS: Credentials = {
  url: "http://localhost:9000",
  email: "admin@calilean.com",
  password: "supersecret",
}

export async function resolveAuth(flags: AuthFlags): Promise<Credentials> {
  if (flags.url && flags.email && flags.password) {
    log.dim("Auth: using explicit flags")
    return { url: flags.url, email: flags.email, password: flags.password }
  }
  if (flags.env) {
    const secrets = resolveFromDoppler(flags.env)
    if (secrets?.MEDUSA_BACKEND_URL && secrets?.MEDUSA_ADMIN_EMAIL && secrets?.MEDUSA_ADMIN_PASSWORD) {
      log.dim(`Auth: resolved from Doppler (${flags.env})`)
      return { url: secrets.MEDUSA_BACKEND_URL, email: secrets.MEDUSA_ADMIN_EMAIL, password: secrets.MEDUSA_ADMIN_PASSWORD }
    }
    log.warn(`Doppler lookup for "${flags.env}" failed, falling back to env vars`)
  }
  const envUrl = process.env.MEDUSA_BACKEND_URL
  const envEmail = process.env.MEDUSA_ADMIN_EMAIL
  const envPassword = process.env.MEDUSA_ADMIN_PASSWORD
  if (envUrl && envEmail && envPassword) {
    log.dim("Auth: using environment variables")
    return { url: envUrl, email: envEmail, password: envPassword }
  }
  log.dim("Auth: using defaults (localhost)")
  return DEFAULTS
}
