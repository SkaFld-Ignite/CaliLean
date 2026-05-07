import { execSync } from "child_process"

const CONFIG_MAP: Record<string, string> = {
  local: "dev_backend",
  dev: "dev_backend",
  stg: "stg",
  prd: "prd_backend",
}

export interface DopplerSecrets {
  MEDUSA_BACKEND_URL?: string
  MEDUSA_ADMIN_EMAIL?: string
  MEDUSA_ADMIN_PASSWORD?: string
}

export function resolveFromDoppler(env: string): DopplerSecrets | null {
  const config = CONFIG_MAP[env]
  if (!config) {
    throw new Error(`Unknown environment "${env}". Valid: ${Object.keys(CONFIG_MAP).join(", ")}`)
  }
  try {
    const cmd = `doppler secrets -p calilean -c ${config} --json 2>/dev/null`
    const output = execSync(cmd, { encoding: "utf-8", timeout: 10000 })
    const secrets = JSON.parse(output)
    return {
      MEDUSA_BACKEND_URL: secrets.BACKEND_PUBLIC_URL?.computed ?? secrets.MEDUSA_BACKEND_URL?.computed,
      MEDUSA_ADMIN_EMAIL: secrets.MEDUSA_ADMIN_EMAIL?.computed,
      MEDUSA_ADMIN_PASSWORD: secrets.MEDUSA_ADMIN_PASSWORD?.computed,
    }
  } catch {
    return null
  }
}
