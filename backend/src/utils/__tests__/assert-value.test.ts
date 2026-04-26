import { assertValue } from "../assert-value"

describe("assertValue", () => {
  it("returns the value when defined", () => {
    expect(assertValue("hello", "missing")).toBe("hello")
    expect(assertValue("", "missing")).toBe("")
  })

  it("throws with the supplied message when undefined", () => {
    expect(() => assertValue(undefined, "DATABASE_URL is not set")).toThrow(
      "DATABASE_URL is not set"
    )
  })
})
