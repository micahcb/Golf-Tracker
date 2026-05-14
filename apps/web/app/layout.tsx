import { Geist_Mono, Figtree } from "next/font/google"
import { Suspense } from "react"

import "@workspace/ui/globals.css"
import { AuthHeader } from "@/components/auth-header"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable)}
    >
      <body>
        <ThemeProvider>
          <Suspense fallback={null}>
            <AuthHeader />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
