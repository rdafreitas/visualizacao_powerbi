import type { Metadata, Viewport } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'

// ── Fontes ────────────────────────────────────────────────────
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

// ── Metadata ─────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'PaVoar Academia Circense',
  description: 'Sistema de gestão da PaVoar Academia Circense',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PaVoar',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2D1B69',
  width: 'device-width',
  initialScale: 1,
}

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full font-inter bg-gray-bg text-gray-dark antialiased">
        {children}
      </body>
    </html>
  )
}
