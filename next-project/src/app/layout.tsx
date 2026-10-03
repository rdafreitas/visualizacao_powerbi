import type { Metadata, Viewport } from 'next'
import { Montserrat_Alternates, Shadows_Into_Light_Two } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
})

const shadows = Shadows_Into_Light_Two({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-shadows',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Andorin Estúdio',
  description: 'Andorin - Divirta-se com saúde e arte circense', // Dê asas aos seus sonhos através do Circo.
}

export const viewport: Viewport = {
  themeColor: '#F27406',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${shadows.variable} h-full`}>
      <body className="min-h-full font-montserrat brand-off-white antialiased">
        {children}
      </body>
    </html>
  )
}
