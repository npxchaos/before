import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompta - Turn any webpage into an AI answer engine",
  description: "Get featured answers in Google Search and AI tools like ChatGPT, Google AI Overviews, Claude, Gemini, Grok, Perplexity, and more.",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/prompta-avatar.png",
  },
  openGraph: {
    title: "Prompta - Turn any webpage into an AI answer engine",
    description: "Get featured answers in Google Search and AI tools like ChatGPT, Google AI Overviews, Claude, Gemini, Grok, Perplexity, and more.",
    url: "https://prompta.com",
    siteName: "Prompta",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prompta - AI Answer Engine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompta - Turn any webpage into an AI answer engine",
    description: "Get featured answers in Google Search and AI tools like ChatGPT, Google AI Overviews, Claude, Gemini, Grok, Perplexity, and more.",
    images: ["/assets/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
