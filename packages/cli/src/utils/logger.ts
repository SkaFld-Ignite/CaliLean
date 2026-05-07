import chalk from "chalk"

export const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
  error: (msg: string) => console.error(chalk.red("✗"), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),
  header: (msg: string) => console.log(chalk.bold.underline(msg)),
  create: (resource: string, key: string) =>
    console.log(chalk.green("+"), `${resource}: ${key}`, chalk.dim("[CREATE]")),
  update: (resource: string, key: string) =>
    console.log(chalk.yellow("~"), `${resource}: ${key}`, chalk.dim("[UPDATE]")),
  skip: (resource: string, key: string) =>
    console.log(chalk.green("✓"), `${resource}: ${key}`, chalk.dim("[IN SYNC]")),
  unmanaged: (resource: string, key: string) =>
    console.log(chalk.dim("-"), `${resource}: ${key}`, chalk.dim("[UNMANAGED]")),
  field: (path: string, from: unknown, to: unknown) =>
    console.log(chalk.dim("    "), `${path}: ${chalk.red(String(from))} → ${chalk.green(String(to))}`),
}

let verboseEnabled = false
export function setVerbose(v: boolean) { verboseEnabled = v }
export function verbose(msg: string) {
  if (verboseEnabled) console.log(chalk.dim(`  [verbose] ${msg}`))
}
