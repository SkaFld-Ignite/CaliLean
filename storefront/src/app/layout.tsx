import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google"
import "styles/globals.css"
import AgeGate from "@modules/bluum/components/age-gate"

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "CaliLean | Research-Grade Peptides — South Bay",
  description:
    "Research-grade peptides. Plainly labeled. Built for the South Bay. Third-party assayed, batch-traceable, not for human consumption.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-c.svg", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#1F2326",
      },
    ],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const fontVars = `${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`

  return (
    <html lang="en" data-mode="light" className={fontVars}>
      <body className="bg-calilean-bg text-calilean-ink font-sans">
        <AgeGate />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
