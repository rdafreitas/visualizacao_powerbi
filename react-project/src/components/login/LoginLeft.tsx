// ─────────────────────────────────────────────────────────────
// src/components/login/LoginLeft.tsx
// Coluna esquerda do login — branding PaVoar.
// Paleta: bordo (#7A1D2C) + orange (#f27406) + off-white (#F4E7CE)
// Fonte do logotipo: Shadows Into Light Two
// ─────────────────────────────────────────────────────────────

const STATS = [
  { valor: '84', label: 'Alunos ativos' },
  { valor: '5',  label: 'Modalidades'   },
  { valor: '7',  label: 'Aulas hoje'    },
]

export function LoginLeft() {
  return (
    <div
      className="flex-1 relative flex flex-col items-center justify-center px-12 py-16 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #211D1C 0%, #7A1D2C 55%, #a02438 100%)',
      }}
    >
      {/* Anel decorativo superior direito — orange */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 500, height: 500,
          top: -120, right: -160,
          border: '60px solid rgba(242,116,6,0.10)',
        }}
      />
      {/* Anel decorativo inferior esquerdo — off-white */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 320, height: 320,
          bottom: -80, left: -80,
          border: '40px solid rgba(244,231,206,0.12)',
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 text-center max-w-sm">
        {/* Logo */}
        <span
          className="text-[64px] block mb-4"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(242,116,6,0.6))' }}
        >
          🎪
        </span>

        {/* Nome com fonte decorativa */}
        <h1
          className="text-[48px] text-white leading-none"
          style={{ fontFamily: 'var(--font-shadows)', fontWeight: 400, letterSpacing: '2px' }}
        >
          PaVoar
        </h1>

        <span className="text-xs font-semibold uppercase tracking-[3px] mt-2 block"
          style={{ color: 'rgba(244,231,206,0.55)' }}>
          Academia Circense
        </span>

        <p className="text-[15px] mt-8 leading-relaxed"
          style={{ color: 'rgba(244,231,206,0.60)' }}>
          Gerencie aulas, alunos e a evolução da sua academia em um só lugar.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-10 mt-12">
          {STATS.map(({ valor, label }) => (
            <div key={label} className="text-center">
              <p
                className="text-3xl font-extrabold text-white leading-none"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {valor}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(244,231,206,0.45)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
