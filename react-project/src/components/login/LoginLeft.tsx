const STATS = [
  { valor: '84', label: 'Alunos ativos' },
  { valor: '5',  label: 'Modalidades'   },
  { valor: '7',  label: 'Aulas hoje'    },
]

export function LoginLeft() {
  return (
    <div
      className="flex-1 relative flex flex-col items-center justify-center px-12 py-16 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #2D1B69 55%, #3D2A85 100%)' }}
    >
      <div className="absolute pointer-events-none rounded-full"
        style={{ width:500, height:500, top:-120, right:-160, border:'60px solid rgba(255,107,53,0.08)' }} />
      <div className="absolute pointer-events-none rounded-full"
        style={{ width:320, height:320, bottom:-80, left:-80, border:'40px solid rgba(255,209,102,0.07)' }} />
      <div className="relative z-10 text-center max-w-sm">
        <span className="text-[64px] block mb-4"
          style={{ filter:'drop-shadow(0 8px 24px rgba(255,107,53,0.5))' }}>🎪</span>
        <h1 className="font-poppins text-[42px] font-extrabold text-white tracking-tight leading-none">PaVoar</h1>
        <span className="text-xs font-semibold text-white/45 uppercase tracking-[3px] mt-2 block">Academia Circense</span>
        <p className="text-[15px] text-white/55 mt-8 leading-relaxed">
          Gerencie aulas, alunos e a evolução da sua academia em um só lugar.
        </p>
        <div className="flex justify-center gap-10 mt-12">
          {STATS.map(({ valor, label }) => (
            <div key={label} className="text-center">
              <p className="font-poppins text-3xl font-extrabold text-white leading-none">{valor}</p>
              <p className="text-[11px] text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
