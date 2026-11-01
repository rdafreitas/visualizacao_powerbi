// ─────────────────────────────────────────────────────────────
// src/components/landing/LandingHero.tsx
// Hero de tela cheia com SVG do picadeiro iluminado,
// frases rotativas e CTA.
// ─────────────────────────────────────────────────────────────
'use client'

import { useEffect, useRef } from 'react'

interface LandingHeroProps {
  onSignIn: () => void
}

const QUOTES = [
  '"O circo é a única arte que vive no corpo."',
  '"Cada subida começa com o primeiro apoio."',
  '"Não precisa ser atleta. Precisa querer tentar."',
  '"A leveza que você busca mora aqui."',
  '"Força, beleza e coragem — no mesmo espaço."',
]

export function LandingHero({ onSignIn }: LandingHeroProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const idxRef   = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % QUOTES.length
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${idxRef.current * 100}%)`
      }
    }, 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      className="relative flex flex-col items-center justify-center text-center"
      style={{ minHeight: '100vh', padding: '80px 60px 40px', zIndex: 5 }}
    >
      {/* Eyebrow */}
      <div
        className="flex items-center gap-3 mb-7"
        style={{
          fontFamily:    'var(--font-montserrat)',
          fontSize:      '11px',
          fontWeight:    600,
          letterSpacing: '5px',
          textTransform: 'uppercase',
          color:         '#f27406',
        }}
      >
        <span style={{ display: 'inline-block', width: 40, height: 1, background: '#f27406', opacity: .6 }} />
        Academia Circense
        <span style={{ display: 'inline-block', width: 40, height: 1, background: '#f27406', opacity: .6 }} />
      </div>

      {/* Título */}
      <h1
        style={{
          fontFamily:  'var(--font-shadows)',
          fontSize:    'clamp(52px, 8vw, 110px)',
          color:       '#F4E7CE',
          lineHeight:  1.05,
          letterSpacing: '2px',
          margin:      0,
        }}
      >
        Seu corpo é capaz
        <span
          style={{
            display:    'block',
            fontSize:   'clamp(44px, 6.5vw, 86px)',
            background: 'linear-gradient(135deg, #f27406 0%, #F4E7CE 60%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}
        >
          de voar
        </span>
      </h1>

      {/* Picadeiro SVG */}
      <div
        className="relative w-full"
        style={{ maxWidth: 820, margin: '32px 0 0' }}
      >
        {/* Desvanecer lateral */}
        <div style={{ position:'absolute', top:0, bottom:0, left:0, width:80, background:'linear-gradient(to right,#0d0a09,transparent)', zIndex:2, pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, bottom:0, right:0, width:80, background:'linear-gradient(to left,#0d0a09,transparent)', zIndex:2, pointerEvents:'none' }} />

        <svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'auto', display:'block', filter:'drop-shadow(0 0 32px rgba(242,116,6,0.18))' }}>
          <defs>
            <radialGradient id="gFloor" cx="50%" cy="100%" r="60%">
              <stop offset="0%"   stopColor="#7A1D2C" stopOpacity=".55"/>
              <stop offset="60%"  stopColor="#3d0e16" stopOpacity=".35"/>
              <stop offset="100%" stopColor="#0d0a09" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="gTent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2a1208" stopOpacity=".9"/>
              <stop offset="100%" stopColor="#0d0a09" stopOpacity=".4"/>
            </linearGradient>
            <radialGradient id="gSpot" cx="50%" cy="0%" r="100%">
              <stop offset="0%"   stopColor="#f27406" stopOpacity=".28"/>
              <stop offset="40%"  stopColor="#f27406" stopOpacity=".12"/>
              <stop offset="100%" stopColor="#f27406" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="gSpotL" cx="0%" cy="0%" r="100%">
              <stop offset="0%"   stopColor="#F4E7CE" stopOpacity=".18"/>
              <stop offset="100%" stopColor="#F4E7CE" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="gSpotR" cx="100%" cy="0%" r="100%">
              <stop offset="0%"   stopColor="#F4E7CE" stopOpacity=".18"/>
              <stop offset="100%" stopColor="#F4E7CE" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f27406" stopOpacity=".35"/>
              <stop offset="100%" stopColor="#f27406" stopOpacity="0"/>
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Lona */}
          <g opacity=".22">
            <path d="M450,10 Q200,60 60,200 L60,10 Z"  fill="#7A1D2C"/>
            <path d="M450,10 Q350,40 280,200 L200,10 Z" fill="#F4E7CE"/>
            <path d="M450,10 Q450,30 450,200 L380,10 Z" fill="#7A1D2C"/>
            <path d="M450,10 Q550,40 620,200 L700,10 Z" fill="#F4E7CE"/>
            <path d="M450,10 Q700,60 840,200 L840,10 Z" fill="#7A1D2C"/>
          </g>
          <rect x="0" y="0" width="900" height="380" fill="url(#gTent)"/>
          {/* Holofotes */}
          <polygon points="450,0 330,310 570,310" fill="url(#gSpot)" opacity=".9"/>
          <polygon points="100,0 200,310 420,310" fill="url(#gSpotL)" opacity=".7"/>
          <polygon points="800,0 700,310 480,310" fill="url(#gSpotR)" opacity=".7"/>
          {/* Arena */}
          <ellipse cx="450" cy="310" rx="370" ry="68" fill="#1a0810" opacity=".8"/>
          <ellipse cx="450" cy="315" rx="370" ry="68" fill="none" stroke="#7A1D2C" strokeWidth="1.5" opacity=".25"/>
          <ellipse cx="450" cy="305" rx="160" ry="35" fill="url(#gGlow)" filter="url(#softGlow)"/>
          <ellipse cx="450" cy="310" rx="370" ry="68" fill="none" stroke="#f27406" strokeWidth="1" strokeDasharray="6 8" opacity=".30"/>
          {/* Grades */}
          <g opacity=".18" stroke="#F4E7CE" strokeWidth="1" fill="none">
            <ellipse cx="450" cy="310" rx="310" ry="55"/>
            <ellipse cx="450" cy="310" rx="250" ry="44"/>
          </g>
          {/* Tecido */}
          <line x1="450" y1="0" x2="450" y2="190" stroke="#F4E7CE" strokeWidth="1.2" opacity=".35"/>
          <path d="M450,10 Q420,80 430,190 Q440,260 420,300" fill="none" stroke="#7A1D2C" strokeWidth="2.5" opacity=".6"/>
          <path d="M450,10 Q480,80 470,190 Q460,260 480,300" fill="none" stroke="#7A1D2C" strokeWidth="2.5" opacity=".6"/>
          {/* Artista */}
          <g filter="url(#glow)" opacity=".85">
            <ellipse cx="450" cy="178" rx="6" ry="9" fill="#F4E7CE"/>
            <circle cx="450" cy="165" r="6" fill="#F4E7CE"/>
            <line x1="432" y1="174" x2="450" y2="178" stroke="#F4E7CE" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="468" y1="174" x2="450" y2="178" stroke="#F4E7CE" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="450" y1="187" x2="460" y2="210" stroke="#F4E7CE" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="450" y1="187" x2="440" y2="215" stroke="#F4E7CE" strokeWidth="2.2" strokeLinecap="round"/>
          </g>
          {/* Holofotes no teto */}
          <g filter="url(#glow)">
            <circle cx="450" cy="8"  r="7"  fill="#f27406" opacity=".9"/>
            <circle cx="450" cy="8"  r="14" fill="#f27406" opacity=".3"/>
            <circle cx="200" cy="28" r="5"  fill="#F4E7CE" opacity=".7"/>
            <circle cx="200" cy="28" r="10" fill="#F4E7CE" opacity=".2"/>
            <circle cx="700" cy="28" r="5"  fill="#F4E7CE" opacity=".7"/>
            <circle cx="700" cy="28" r="10" fill="#F4E7CE" opacity=".2"/>
            <line x1="450" y1="15" x2="450" y2="55" stroke="#f27406" strokeWidth="1" opacity=".4"/>
            <line x1="200" y1="33" x2="240" y2="70" stroke="#F4E7CE" strokeWidth="1" opacity=".3"/>
            <line x1="700" y1="33" x2="660" y2="70" stroke="#F4E7CE" strokeWidth="1" opacity=".3"/>
          </g>
          {/* Estrelas */}
          <g fill="#F4E7CE">
            <circle cx="150" cy="50"  r="1.2" opacity=".5"/>
            <circle cx="760" cy="40"  r="1.5" opacity=".6"/>
            <circle cx="80"  cy="130" r="1"   opacity=".4"/>
            <circle cx="820" cy="110" r="1.2" opacity=".5"/>
            <circle cx="300" cy="20"  r="1"   opacity=".45"/>
            <circle cx="610" cy="15"  r="1"   opacity=".45"/>
          </g>
          <g fill="#f27406">
            <circle cx="350" cy="80"  r="1.2" opacity=".4"/>
            <circle cx="555" cy="65"  r="1"   opacity=".4"/>
          </g>
          {/* Plateia */}
          <g opacity=".20" fill="#211D1C">
            <ellipse cx="100" cy="310" rx="45" ry="20"/>
            <ellipse cx="800" cy="310" rx="45" ry="20"/>
          </g>
          <g opacity=".25" fill="#3a2020">
            {[68,82,96,110,124].map(cx => <circle key={cx} cx={cx} cy="302" r="5"/>)}
            {[790,804,818,832,846].map(cx => <circle key={cx} cx={cx} cy="302" r="5"/>)}
          </g>
        </svg>
      </div>

      {/* Subtítulo */}
      <p
        style={{
          fontFamily:  'var(--font-montserrat)',
          fontSize:    '17px',
          fontWeight:  400,
          color:       'rgba(244,231,206,0.60)',
          margin:      '28px 0 44px',
          maxWidth:    520,
          lineHeight:  1.8,
          letterSpacing: '0.2px',
          textAlign:   'center',
        }}
      >
        O circo não é um dom — é uma escolha.<br/>
        Venha descobrir até onde você consegue chegar.
      </p>

      {/* CTA */}
      <button
        onClick={onSignIn}
        className="cursor-pointer relative overflow-hidden transition-all duration-300"
        style={{
          fontFamily:    'var(--font-montserrat)',
          fontSize:      '14px',
          fontWeight:    700,
          padding:       '18px 52px',
          borderRadius:  '50px',
          border:        'none',
          background:    'linear-gradient(135deg, #7A1D2C, #f27406)',
          color:         '#F4E7CE',
          boxShadow:     '0 12px 40px rgba(122,29,44,0.45), 0 0 60px rgba(242,116,6,0.15)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform  = 'translateY(-2px)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 50px rgba(122,29,44,0.55), 0 0 80px rgba(242,116,6,0.2)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform  = 'none'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(122,29,44,0.45), 0 0 60px rgba(242,116,6,0.15)'
        }}
      >
        Quero começar agora →
      </button>

      {/* Frases rotativas */}
      <div
        style={{
          marginTop:   52,
          paddingTop:  32,
          borderTop:   '1px solid rgba(244,231,206,0.10)',
          overflow:    'hidden',
          width:       '100%',
          maxWidth:    600,
          textAlign:   'center',
        }}
      >
        <div
          ref={trackRef}
          style={{ display:'flex', transition:'transform 1s cubic-bezier(0.77,0,0.18,1)' }}
        >
          {QUOTES.map((q, i) => (
            <span
              key={i}
              style={{
                minWidth:      '100%',
                fontFamily:    'var(--font-shadows)',
                fontSize:      '20px',
                color:         'rgba(244,231,206,0.50)',
                letterSpacing: '0.5px',
                display:       'block',
                padding:       '0 20px',
              }}
            >
              {q}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
