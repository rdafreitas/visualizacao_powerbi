// ─────────────────────────────────────────────────────────────
// src/app/page.tsx
//
// Página raiz do site — renderiza o formulário de login.
// É um Server Component (sem 'use client').
//
// POR QUE O <Suspense> É OBRIGATÓRIO AQUI?
//   O LoginForm usa useSearchParams() para ler o parâmetro
//   ?redirect= gravado pelo Proxy. O Next.js exige que
//   qualquer componente com useSearchParams() esteja dentro
//   de um <Suspense>.
//
//   Motivo técnico: durante a geração estática (build), os search
//   params não existem — a página é renderizada sem contexto de URL.
//   O <Suspense> instrui o Next.js a renderizar o fallback (spinner)
//   nessa etapa e hidratar com o valor real quando o browser carregar.
//
//   Sem o <Suspense>, o build falha com:
//   "Missing Suspense boundary with useSearchParams"
// ─────────────────────────────────────────────────────────────

import { Suspense }   from 'react'
import { LoginForm }  from '@/app/pages/login/LoginForm'
import { LoginRight } from '@/app/pages/login/LoginRigth'

export const metadata = { title: 'Login — Estúdio Andorin' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* O Suspense envolve apenas o LoginForm — que usa useSearchParams.
          O fallback replica o espaço visual do formulário para evitar
          layout shift (o painel direito não se move enquanto hidrata). */}
      <Suspense
        fallback={
          <div className="w-[480px] flex-shrink-0 bg-white flex items-center justify-center">
            <span
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#7A1D2C', borderTopColor: 'transparent' }}
            />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      <LoginRight />
    </div>
  )
}
