import { readFileSync } from "fs"
import { join } from "path"

const COA_DIR = join(__dirname, "..")
const MIDDLEWARES = join(__dirname, "..", "..", "..", "..", "..", "middlewares.ts")

function read(path: string): string {
  return readFileSync(path, "utf8")
}

describe("COA route layout", () => {
  // The bug: middleware matcher said /coa/files but the POST handler lived at
  // /coa, so multer never ran on the upload path. These tests pin down the
  // file-system layout so the next refactor can't silently desync them.
  it("POST upload handler lives in coa/files/route.ts", () => {
    const filesRoute = read(join(COA_DIR, "files", "route.ts"))
    expect(filesRoute).toMatch(/export const POST\s*=/)
    expect(filesRoute).not.toMatch(/export const PATCH\s*=/)
    expect(filesRoute).not.toMatch(/export const DELETE\s*=/)
  })

  it("POST/DELETE panel mutations stay in coa/route.ts (no PATCH)", () => {
    const panelRoute = read(join(COA_DIR, "route.ts"))
    expect(panelRoute).toMatch(/export const POST\s*=/)
    expect(panelRoute).toMatch(/export const DELETE\s*=/)
    expect(panelRoute).not.toMatch(/export const PATCH\s*=/)
  })

  it("multer matcher targets /coa/files (where the POST handler lives)", () => {
    const middlewares = read(MIDDLEWARES)
    expect(middlewares).toMatch(
      /matcher:\s*["']\/admin\/products\/:id\/coa\/files["']/
    )
  })
})
