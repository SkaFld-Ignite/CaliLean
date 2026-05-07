import { diffObjects } from "../src/engine/diff"

describe("diffObjects", () => {
  it("returns empty array for identical objects", () => {
    const obj = { name: "Test", currency: "usd" }
    expect(diffObjects(obj, { ...obj }, ["name", "currency"])).toEqual([])
  })

  it("detects changed fields", () => {
    const desired = { name: "Updated", currency: "usd" }
    const current = { name: "Original", currency: "usd" }
    const diffs = diffObjects(desired, current, ["name", "currency"])
    expect(diffs).toEqual([{ path: "name", from: "Original", to: "Updated" }])
  })

  it("detects added fields (undefined in current)", () => {
    const desired: Record<string, unknown> = { name: "Test", description: "New" }
    const current: Record<string, unknown> = { name: "Test" }
    const diffs = diffObjects(desired, current, ["name", "description"])
    expect(diffs).toEqual([{ path: "description", from: undefined, to: "New" }])
  })

  it("ignores fields not in the compare list", () => {
    const desired = { name: "Test", secret: "changed" }
    const current = { name: "Test", secret: "original" }
    const diffs = diffObjects(desired, current, ["name"])
    expect(diffs).toEqual([])
  })
})
