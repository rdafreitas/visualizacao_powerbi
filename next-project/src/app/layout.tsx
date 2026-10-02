import type { Metadata, Viewport } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: 'Andorin Estúdio',
  description: 'Sistema de gestão da Andorin Estúdio',
}

export const viewport: Viewport = {
  themeColor: '#2D1B69',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${inter.variable} h-full`}>
      <body className="min-h-full font-inter bg-gray-bg text-gray-dark antialiased">
        {children}
      </body>
    </html>
  )
}
