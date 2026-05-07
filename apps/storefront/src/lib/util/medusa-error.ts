export default function medusaError(error: unknown): never {
  // Medusa JS SDK throws errors with message directly
  let message: unknown = "An unknown error occurred"

  if (error instanceof Error) {
    message = error.message
  } else if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as { response?: { data?: { message?: string } | string } }).response
    if (typeof response?.data === "object" && response.data !== null && "message" in response.data) {
      message = response.data.message
    } else if (response?.data) {
      message = response.data
    }
  }

  const formatted =
    typeof message === "string"
      ? message.charAt(0).toUpperCase() + message.slice(1)
      : String(message)

  throw new Error(formatted)
}
