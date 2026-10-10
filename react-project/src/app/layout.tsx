import type { Metadata, Viewport } from 'next'
import { Montserrat_Alternates, Shadows_Into_Light_Two } from 'next/font/google'
import './globals.css'

// ── Fontes ────────────────────────────────────────────────────
const montserrat = Montserrat_Alternates({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display:  'swap',
})

const shadows = Shadows_Into_Light_Two({
  subsets:  ['latin'],
  weight:   ['400'],
  variable: '--font-shadows',
  display:  'swap',
})

// ── Metadata ─────────────────────────────────────────────────
export const metadata: Metadata = {
  title:       'PaVoar Academia Circense',
  description: 'Sistema de gestão da PaVoar Academia Circense',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'PaVoar',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor:   '#7A1D2C',
  width:        'device-width',
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
      className={`${montserrat.variable} ${shadows.variable} h-full`}
    >
      <body className="min-h-full font-montserrat bg-gray-bg text-gray-dark antialiased">
        {children}
      </body>
    </html>
  )
}
