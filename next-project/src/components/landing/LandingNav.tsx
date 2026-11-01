// ─────────────────────────────────────────────────────────────
// src/components/landing/LandingNav.tsx
// Navbar fixa da landing page.
// Transparente no topo → vidro fosco ao rolar (via classe JS).
// Sign In abre o modal de login.
// ─────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState } from 'react'

interface LandingNavProps {
  onSignIn: () => void
}

const LINKS = [
  { label: 'Eventos',       id: 'sec-eventos'      },
  { label: 'Workshops',     id: 'sec-workshops'     },
  { label: 'Modalidades',   id: 'sec-modalidades'   },
  { label: 'Profissionais', id: 'sec-profissionais' },
  { label: 'Sobre',         id: 'sec-sobre'         },
]

export function LandingNav({ onSignIn }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[400] flex items-center justify-between transition-all duration-300"
      style={{
        padding:    scrolled ? '14px 60px' : '22px 60px',
        background: scrolled ? 'rgba(13,10,9,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        boxShadow:  scrolled ? '0 1px 0 rgba(244,231,206,0.06), 0 4px 24px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      {/* Logo — volta ao topo */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0"
      >
        <span
          className="text-3xl"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(242,116,6,0.5))' }}
        >
          🎪
        </span>
        <div className="text-left">
          <span
            className="text-3xl text-off-white leading-none block"
            style={{ fontFamily: 'var(--font-shadows)', letterSpacing: '2px' }}
          >
            Estúdio Andorin
          </span>
          <span
            className="text-[9px] font-semibold uppercase tracking-[4px] block"
            style={{ color: 'rgba(244,231,206,0.45)', marginTop: '-2px', fontFamily: 'var(--font-montserrat)' }}
          >
            Arte Circense
          </span>
        </div>
      </button>

      {/* Links de navegação */}
      <div className="flex items-center gap-10">
        {LINKS.map(({ label, id }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="bg-transparent border-none cursor-pointer transition-colors duration-200"
            style={{
              fontFamily:    'var(--font-montserrat)',
              fontSize:      '13px',
              fontWeight:    500,
              color:         'rgba(244,231,206,0.65)',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#F4E7CE' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(244,231,206,0.65)' }}
          >
            {label}
          </button>
        ))}

        {/* Botão Sign In */}
        <button
          onClick={onSignIn}
          className="cursor-pointer transition-all duration-250"
          style={{
            fontFamily:    'var(--font-montserrat)',
            fontSize:      '13px',
            fontWeight:    700,
            padding:       '10px 28px',
            borderRadius:  '30px',
            border:        '1.5px solid rgba(244,231,206,0.35)',
            background:    'transparent',
            color:         '#F4E7CE',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.background  = '#7A1D2C'
            b.style.borderColor = '#7A1D2C'
            b.style.boxShadow   = '0 6px 20px rgba(122,29,44,0.45)'
            b.style.transform   = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.background  = 'transparent'
            b.style.borderColor = 'rgba(244,231,206,0.35)'
            b.style.boxShadow   = 'none'
            b.style.transform   = 'none'
          }}
        >
          Sign In
        </button>
      </div>
    </nav>
  )
}
