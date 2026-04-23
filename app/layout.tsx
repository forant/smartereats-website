import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Header } from '@/components/landing/header'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: 'SmarterEats - Make smarter food choices, fast',
  description: 'Scan or search foods, get a clear score, and decide what\'s better for your goal.',
  generator: 'v0.app',
  icons: {
    icon: '/icon-32.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        <Header />
        {children}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "d2a7bbc1473d40f28681f7eeb47c919f"}'
          strategy="afterInteractive"
          defer
        />
      </body>
    </html>
  )
}
