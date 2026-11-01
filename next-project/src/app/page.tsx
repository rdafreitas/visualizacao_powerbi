// ─────────────────────────────────────────────────────────────
// src/app/page.tsx
// Página raiz — renderiza a Landing Page do Estúdio Andorin.
//
// O LoginForm (dentro do modal) usa useSearchParams() e portanto
// precisa de <Suspense>. Isso já é tratado internamente pelo
// LandingSignInModal que envolve o LoginForm em <Suspense>.
//
// Esta página é Server Component (sem 'use client').
// O LandingPage é Client Component (gerencia o estado do modal).
// ─────────────────────────────────────────────────────────────

import { LandingPage } from '@/components/landing/LandingPage'

export const metadata = {
  title:       'Estúdio Andorin — Arte Circense',
  description: 'Estúdio Andorin — Divirta-se com saúde e arte circense. Lira, Tecido, Flex e Personal Circo.',
}

export default function RootPage() {
  return <LandingPage />
}
