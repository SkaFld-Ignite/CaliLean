import { syncResource } from "../src/engine/sync"
import { ResourceHandler } from "../src/engine/types"
import { CaliLeanClient } from "../src/client"

// Suppress log output during tests
jest.mock("../src/utils/logger", () => ({
  log: {
    info: jest.fn(), success: jest.fn(), warn: jest.fn(), error: jest.fn(),
    dim: jest.fn(), header: jest.fn(), create: jest.fn(), update: jest.fn(),
    skip: jest.fn(), unmanaged: jest.fn(), field: jest.fn(),
  },
  verbose: jest.fn(),
}))

interface TestConfig { handle: string; name: string }
interface TestLive { id: string; handle: string; name: string }

function createMockHandler(liveRecords: TestLive[]): ResourceHandler<TestConfig, TestLive> {
  return {
    name: "test-resource",
    keyField: "handle",
    dump: jest.fn().mockResolvedValue(liveRecords),
    toConfig: (live) => ({ handle: live.handle, name: live.name }),
    toPayload: (config) => ({ handle: config.handle, name: config.name }),
    getKey: (config) => config.handle,
    getLiveKey: (live) => live.handle,
    diffFields: ["name"],
  }
}

function createMockClient() {
  return {
    get: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
    healthCheck: jest.fn().mockResolvedValue(true),
  } as unknown as CaliLeanClient
}

describe("syncResource", () => {
  it("creates missing resources", async () => {
    const handler = createMockHandler([])
    const client = createMockClient()
    const configs: TestConfig[] = [{ handle: "new-item", name: "New Item" }]

    const result = await syncResource(client, handler, configs)

    expect(result.created).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.unmanaged).toBe(0)
    expect((client.post as jest.Mock)).toHaveBeenCalledWith(
      "/test-resource",
      { handle: "new-item", name: "New Item" }
    )
  })

  it("skips in-sync resources", async () => {
    const live: TestLive[] = [{ id: "id-1", handle: "existing", name: "Existing" }]
    const handler = createMockHandler(live)
    const client = createMockClient()
    const configs: TestConfig[] = [{ handle: "existing", name: "Existing" }]

    const result = await syncResource(client, handler, configs)

    expect(result.skipped).toBe(1)
    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
    expect((client.post as jest.Mock)).not.toHaveBeenCalled()
  })

  it("flags unmanaged resources", async () => {
    const live: TestLive[] = [{ id: "id-1", handle: "orphan", name: "Orphan" }]
    const handler = createMockHandler(live)
    const client = createMockClient()

    const result = await syncResource(client, handler, [])

    expect(result.unmanaged).toBe(1)
    expect(result.created).toBe(0)
  })

  it("does not call API in dry-run mode", async () => {
    const handler = createMockHandler([])
    const client = createMockClient()
    const configs: TestConfig[] = [{ handle: "dry-item", name: "Dry Item" }]

    const result = await syncResource(client, handler, configs, true)

    expect(result.created).toBe(1)
    expect((client.post as jest.Mock)).not.toHaveBeenCalled()
  })
})
