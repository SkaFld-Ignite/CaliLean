import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { log, setVerbose } from "../utils/logger"

export function registerEnvCommand(program: Command): void {
  program
    .command("env")
    .description("Show target environment and verify connectivity + auth")
    .action(async () => {
      const opts = program.opts()
      if (opts.verbose) setVerbose(true)

      const creds = await resolveAuth(opts)

      log.header("Environment")
      log.info(`URL:   ${creds.url}`)
      log.info(`Email: ${creds.email}`)

      const client = new CaliLeanClient(creds)

      // Health check
      const healthy = await client.healthCheck()
      if (!healthy) {
        log.error(`Backend unreachable at ${creds.url}`)
        process.exitCode = 1
        return
      }
      log.success("Backend reachable")

      // Auth check
      try {
        await client.authenticate()
        log.success("Authentication successful")
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log.error(`Authentication failed: ${message}`)
        process.exitCode = 1
      }
    })
}
