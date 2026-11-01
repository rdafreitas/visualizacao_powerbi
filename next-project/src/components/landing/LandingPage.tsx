// ─────────────────────────────────────────────────────────────
// src/components/landing/LandingPage.tsx
// Componente cliente raiz da landing page.
// Orquestra: fundo, partículas, nav, hero, seções, footer e modal.
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useEffect } from 'react'
import { LandingNav }          from './LandingNav'
import { LandingHero }         from './LandingHero'
import { LandingSections }     from './LandingSections'
import { LandingSignInModal }  from './LandingSignInModal'

export function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)

  // Criar partículas flutuantes no mount
  useEffect(() => {
    const container = document.getElementById('lp-particles')
    if (!container || container.children.length > 0) return
    const cores = [
      'rgba(242,116,6,',
      'rgba(122,29,44,',
      'rgba(244,231,206,',
      'rgba(186,208,217,',
    ]
    for (let i = 0; i < 28; i++) {
      const p    = document.createElement('div')
      const cor  = cores[Math.floor(Math.random() * cores.length)]
      const op   = (0.08 + Math.random() * 0.18).toFixed(2)
      const sz   = (3 + Math.random() * 6).toFixed(1)
      const dur  = (12 + Math.random() * 24).toFixed(1)
      const del  = (Math.random() * 20).toFixed(1)
      const lft  = (Math.random() * 100).toFixed(1)
      p.style.cssText = [
        'position:absolute',
        `width:${sz}px`,
        `height:${sz}px`,
        `background:${cor}${op})`,
        'border-radius:50%',
        `left:${lft}%`,
        'bottom:-20px',
        'pointer-events:none',
        `animation:particleFloat ${dur}s linear -${del}s infinite`,
      ].join(';')
      container.appendChild(p)
    }
  }, [])

  return (
    <>
      {/* Keyframes das partículas (injetados uma vez) */}
      <style>{`
        @keyframes particleFloat {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes ringFloat {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%       { transform: scale(1.04) rotate(2deg); }
        }
        html { scroll-behavior: smooth; scroll-padding-top: 80px; }
      `}</style>

      {/* Fundo escuro */}
      <div
        style={{
          minHeight: '100vh',
          background: '#0d0a09',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradientes de profundidade */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(122,29,44,.45) 0%, transparent 70%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(242,116,6,.12) 0%, transparent 60%),
              radial-gradient(ellipse 40% 50% at 20% 60%, rgba(186,208,217,.06) 0%, transparent 60%)
            `,
          }}
        />

        {/* Anéis decorativos */}
        {[
          { w:700, h:700, top:-200, right:-250, b:'1px solid rgba(242,116,6,.12)', anim:'18s ease-in-out infinite' },
          { w:500, h:500, top:-100, right:-150, b:'1px solid rgba(242,116,6,.08)', anim:'14s ease-in-out infinite reverse' },
          { w:900, h:900, bottom:-300, left:-350, b:'1px solid rgba(122,29,44,.15)', anim:'22s ease-in-out infinite' },
          { w:320, h:320, bottom:80, left:60, b:'1px solid rgba(244,231,206,.06)', anim:'10s ease-in-out infinite reverse' },
        ].map(({ w, h, anim, ...style }, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: w, height: h,
              borderRadius: '50%',
              border: style.b,
              pointerEvents: 'none',
              animation: `ringFloat ${anim}`,
              ...style,
            } as React.CSSProperties}
          />
        ))}

        {/* Container de partículas */}
        <div id="lp-particles" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

        {/* Navegação fixa */}
        <LandingNav onSignIn={() => setModalOpen(true)} />

        {/* Hero */}
        <LandingHero onSignIn={() => setModalOpen(true)} />

        {/* Seções de conteúdo */}
        <LandingSections />

        {/* Footer */}
        <footer
          style={{
            position: 'relative', zIndex: 5,
            padding: '32px 60px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(244,231,206,0.06)',
          }}
        >
          <span style={{ fontFamily:'var(--font-montserrat)', fontSize:11, color:'rgba(244,231,206,0.30)' }}>
            © 2026 Estúdio Andorin. Todos os direitos reservados.
          </span>
          <div style={{ display:'flex', gap:24 }}>
            {['Privacidade','Termos','Contato'].map(l => (
              <a
                key={l}
                href="#"
                style={{ fontFamily:'var(--font-montserrat)', fontSize:11, color:'rgba(244,231,206,0.35)', textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#f27406' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(244,231,206,0.35)' }}
              >
                {l}
              </a>
            ))}
          </div>
        </footer>
      </div>

      {/* Modal Sign In */}
      <LandingSignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
