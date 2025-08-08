import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Email Verification - Prompta",
  description: "Verify your email address to activate your Prompta account",
}

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
