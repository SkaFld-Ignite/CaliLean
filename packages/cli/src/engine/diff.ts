export interface FieldDiff {
  path: string
  from: unknown
  to: unknown
}

export function diffObjects(
  desired: Record<string, unknown>,
  current: Record<string, unknown>,
  fields: string[]
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  for (const field of fields) {
    const desiredVal = desired[field]
    const currentVal = current[field]
    if (JSON.stringify(desiredVal) !== JSON.stringify(currentVal)) {
      diffs.push({ path: field, from: currentVal, to: desiredVal })
    }
  }
  return diffs
}
