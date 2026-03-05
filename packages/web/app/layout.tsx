import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const title = 'Chowda for Lobsters: calm reads and smarter discovery'
const description =
  'Chowda brings a cleaner, mobile-friendly Lobsters experience with focused reading, quick navigation, and room for community-powered utilities.'

export const metadata: Metadata = {
  metadataBase: new URL('https://chowda.app'),
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://chowda.app',
    siteName: 'Chowda',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Chowda app preview with call-to-action button.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#AC130D' },
    { media: '(prefers-color-scheme: dark)', color: '#980000' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
