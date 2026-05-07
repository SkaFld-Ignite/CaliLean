#!/usr/bin/env node
import { Command } from "commander"
import { registerEnvCommand } from "./commands/env"
import { registerSyncCommand } from "./commands/sync"
import { registerDiffCommand } from "./commands/diff"
import { registerDumpCommand } from "./commands/dump"
import { registerSeedCommand } from "./commands/seed"

const program = new Command()
  .name("calilean")
  .description("CaliLean Medusa instance configuration CLI")
  .version("0.1.0")
  .option("--env <name>", "Target environment: local, dev, prd")
  .option("--url <url>", "Override backend URL")
  .option("--email <email>", "Override admin email")
  .option("--password <password>", "Override admin password")
  .option("--config <path>", "Config file path", "calilean.config.yaml")
  .option("--verbose", "Show API calls and responses")
  .option("--json", "Output in JSON format")
  .option("--force", "Skip confirmation prompts (for CI)")
  .option("--dry-run", "Show what would change without applying")

registerEnvCommand(program)
registerSyncCommand(program)
registerDiffCommand(program)
registerDumpCommand(program)
registerSeedCommand(program)

program.parse()
