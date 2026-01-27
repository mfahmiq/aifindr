import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GoogleAnalytics } from "@/components/google-analytics"
import { LoginPopupProvider, NavbarLoginPrompt } from "@/components/login-popup"
import { Toaster as SonnerToaster } from "sonner"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://theaiselect.com'),
  title: {
    default: "The AI Select - Best AI Tools Directory & Software Reviews",
    template: "%s | The AI Select"
  },
  description: "Discover and compare the best AI tools, software, and apps for your workflow. The #1 curated AI tool directory for 2026.",
  keywords: ["AI Tools", "Directory", "Artificial Intelligence", "Indonesian AI Community", "The AI Select"],
  authors: [{ name: "The AI Select" }],
  creator: "The AI Select",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "The AI Select - Best AI Tools Directory & Software Reviews",
    description: "Discover and compare the best AI tools, software, and apps for your workflow. The #1 curated AI tool directory for 2026.",
    siteName: "The AI Select",
  },
  twitter: {
    card: "summary_large_image",
    title: "The AI Select - Best AI Tools Directory & Software Reviews",
    description: "Discover and compare the best AI tools, software, and apps for your workflow. The #1 curated AI tool directory for 2026.",
    creator: "@theaiselect",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png", // We should probably generate a proper apple-touch-icon later, but strict mapping for now
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
        <GoogleAnalytics />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoginPopupProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <NavbarLoginPrompt />
            <SonnerToaster position="top-center" richColors />
            <Toaster />
          </LoginPopupProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
