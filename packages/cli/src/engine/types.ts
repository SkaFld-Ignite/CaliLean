import { CaliLeanClient } from "../client"

export interface FieldDiff {
  path: string
  from: unknown
  to: unknown
}

export interface SyncResult {
  resource: string
  created: number
  updated: number
  skipped: number
  unmanaged: number
  errors: Array<{ key: string; error: string }>
}

export interface ResourceHandler<TConfig, TLive = unknown> {
  name: string
  keyField: string
  dump(client: CaliLeanClient): Promise<TLive[]>
  toConfig(live: TLive): TConfig
  toPayload(config: TConfig, existing?: TLive): Record<string, unknown>
  getKey(config: TConfig): string
  getLiveKey(live: TLive): string
  diffFields: string[]
}
