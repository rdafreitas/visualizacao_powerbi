import type { NextConfig } from 'next'

// next-pwa será adicionado após: npm install next-pwa
// Descomente o bloco abaixo após a instalação:
//
// import withPWA from 'next-pwa'
//
// const nextConfig = withPWA({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
// }) satisfies NextConfig
//
// export default nextConfig

const nextConfig: NextConfig = {
  // Habilita o turbopack para desenvolvimento mais rápido
  // experimental: { turbo: {} },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
