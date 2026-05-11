export const getSafeRedirectPath = (redirectTo?: string | null) => {
  if (!redirectTo) {
    return "/"
  }

  return redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/"
}
