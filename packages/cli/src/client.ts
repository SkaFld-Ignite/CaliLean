import { Credentials } from "./auth/resolve"
import { verbose } from "./utils/logger"

export class CaliLeanClient {
  private baseUrl: string
  private token: string | null = null

  constructor(private creds: Credentials) {
    this.baseUrl = creds.url
  }

  async authenticate(): Promise<void> {
    verbose(`Authenticating as ${this.creds.email} at ${this.baseUrl}`)
    const res = await fetch(`${this.baseUrl}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.creds.email, password: this.creds.password }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Auth failed (${res.status}): ${body}`)
    }
    const data = await res.json()
    this.token = data.token
    verbose("Authenticated successfully")
  }

  async adminFetch<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.token) throw new Error("Not authenticated — call authenticate() first")
    verbose(`${method} /admin${path}`)
    const res = await fetch(`${this.baseUrl}/admin${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API ${method} /admin${path} failed (${res.status}): ${text}`)
    }
    return res.json() as Promise<T>
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.adminFetch<T>("GET", path)
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.adminFetch<T>("POST", path, body)
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.adminFetch<T>("DELETE", path)
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`)
      return res.ok
    } catch {
      return false
    }
  }
}
