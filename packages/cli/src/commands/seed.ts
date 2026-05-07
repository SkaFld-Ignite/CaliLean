import { Command } from "commander"
import { resolveAuth } from "../auth/resolve"
import { CaliLeanClient } from "../client"
import { log, setVerbose } from "../utils/logger"

export function registerSeedCommand(program: Command): void {
  program
    .command("seed")
    .description("Seed a fresh Medusa instance from config (alias for sync with warnings)")
    .action(async () => {
      const opts = program.opts()
      if (opts.verbose) setVerbose(true)

      log.header("Seed")
      log.info("Verifying target instance before seeding...")

      // Try to authenticate — warn if admin user doesn't exist
      const creds = await resolveAuth(opts)
      const client = new CaliLeanClient(creds)

      const healthy = await client.healthCheck()
      if (!healthy) {
        log.error(`Backend unreachable at ${creds.url}`)
        log.info("Ensure the Medusa backend is running before seeding.")
        process.exitCode = 1
        return
      }
      log.success("Backend reachable")

      try {
        await client.authenticate()
        log.success("Admin user exists — proceeding with sync")
      } catch {
        log.warn(
          "Admin user authentication failed. You may need to create the admin user first:"
        )
        log.info(`  npx medusa user -e ${creds.email} -p <password>`)
        log.info("Once the admin user exists, re-run this command.")
        process.exitCode = 1
        return
      }

      // Delegate to sync command by invoking it programmatically
      log.info("Delegating to sync command...")
      const syncCmd = program.commands.find((c) => c.name() === "sync")
      if (syncCmd) {
        await syncCmd.parseAsync([], { from: "user" })
      } else {
        log.error("Sync command not registered — cannot proceed")
        process.exitCode = 1
      }
    })
}
