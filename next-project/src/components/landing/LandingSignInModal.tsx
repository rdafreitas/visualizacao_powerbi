// ─────────────────────────────────────────────────────────────
// src/components/landing/LandingSignInModal.tsx
// Modal de Sign In — estilo cinematográfico escuro.
// Reutiliza o LoginForm existente dentro de um overlay.
// ─────────────────────────────────────────────────────────────
'use client'

import { Suspense, useEffect } from 'react'
import { LoginForm }           from '@/app/pages/login/LoginForm'

interface LandingSignInModalProps {
  open:    boolean
  onClose: () => void
}

export function LandingSignInModal({ open, onClose }: LandingSignInModalProps) {
  // Bloquear scroll do body quando modal aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,10,9,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full animate-modal-in"
        style={{
          maxWidth:   480,
          background: '#1a1210',
          border:     '1px solid rgba(244,231,206,0.12)',
          borderRadius: 28,
          boxShadow:  '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(242,116,6,0.08)',
          overflow:   'hidden',
        }}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center transition-all duration-200"
          style={{
            width: 32, height: 32,
            borderRadius: 8,
            border:    '1px solid rgba(244,231,206,0.15)',
            background: 'rgba(244,231,206,0.05)',
            color:      'rgba(244,231,206,0.55)',
            cursor:     'pointer',
            fontSize:   16,
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#7A1D2C'
            b.style.color       = '#F4E7CE'
            b.style.background  = 'rgba(122,29,44,0.25)'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = 'rgba(244,231,206,0.15)'
            b.style.color       = 'rgba(244,231,206,0.55)'
            b.style.background  = 'rgba(244,231,206,0.05)'
          }}
        >
          ✕
        </button>

        {/* Mini logo no topo */}
        <div className="text-center pt-8 pb-0 px-8">
          <span
            className="text-4xl block mb-2"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(242,116,6,0.5))' }}
          >
            🎪
          </span>
          <span
            className="text-2xl text-off-white"
            style={{ fontFamily: 'var(--font-shadows)', letterSpacing: '1px' }}
          >
            Estúdio Andorin
          </span>
        </div>

        {/*
          LoginForm adaptado para o tema escuro via wrapper CSS.
          O componente mantém seu comportamento original (Supabase auth),
          apenas o wrapper escurece o fundo.
        */}
        <div className="signin-modal-form-wrap">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <span
                  className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#7A1D2C', borderTopColor: 'transparent' }}
                />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* CSS escopo para adaptar LoginForm ao tema escuro dentro do modal */}
      <style>{`
        .signin-modal-form-wrap > div {
          background: transparent !important;
          width: 100% !important;
          flex-shrink: unset !important;
        }
        .signin-modal-form-wrap h2 {
          color: #F4E7CE !important;
        }
        .signin-modal-form-wrap p {
          color: rgba(244,231,206,0.55) !important;
        }
        .signin-modal-form-wrap label {
          color: rgba(244,231,206,0.45) !important;
        }
        .signin-modal-form-wrap input {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(244,231,206,0.12) !important;
          color: #F4E7CE !important;
        }
        .signin-modal-form-wrap input::placeholder {
          color: rgba(244,231,206,0.25) !important;
        }
        .signin-modal-form-wrap input:focus {
          border-color: #7A1D2C !important;
          box-shadow: 0 0 0 3px rgba(122,29,44,0.15) !important;
        }
        .signin-modal-form-wrap p.text-xs.text-gray-mid {
          color: rgba(244,231,206,0.30) !important;
        }
      `}</style>
    </div>
  )
}
