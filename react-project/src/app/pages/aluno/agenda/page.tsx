import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Agenda — PaVoar' }

// Dados demo
const AULAS_DIA = [
  { emoji:'🎀', nome:'Tecido Circense',  inicio:'09:00', fim:'10:00', instrutor:'Camila Rocha', local:'Studio A',       vagasDisp:6,  total:10, inscrita:true  },
  { emoji:'🤸', nome:'Acrobacia de Solo',inicio:'10:30', fim:'12:00', instrutor:'Diego Mendes', local:'Sala Principal', vagasDisp:6,  total:12, inscrita:false },
  { emoji:'🪢', nome:'Malabares',        inicio:'14:00', fim:'15:30', instrutor:'Lara Vaz',     local:'Área Externa',   vagasDisp:11, total:15, inscrita:false },
  { emoji:'🎠', nome:'Contorcionismo',   inicio:'17:00', fim:'18:30', instrutor:'Ana Lima',     local:'Studio B',       vagasDisp:0,  total:8,  inscrita:false },
]

const DIAS = [
  { label:'SEG', num:'28', ativo:false },
  { label:'TER', num:'29', ativo:false },
  { label:'QUA', num:'30', ativo:true  },
  { label:'QUI', num:'31', ativo:false },
  { label:'SEX', num:'01', ativo:false },
  { label:'SÁB', num:'02', ativo:false },
]

export default async function AlunoAgendaPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'aluno') redirect('/pages/login')

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Inscreva-se nas aulas disponíveis para o seu plano."
      />

      {/* Tira de dias */}
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm px-5 py-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {DIAS.map((d) => (
            <button
              key={d.num}
              className={`flex flex-col items-center px-4 py-2.5 rounded-xl transition-all ${
                d.ativo
                  ? 'bg-purple text-white'
                  : 'hover:bg-gray-bg text-gray-dark'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${d.ativo ? 'text-white/70' : 'text-gray-mid'}`}>{d.label} Jul</span>
              <span className="font-poppins text-xl font-extrabold leading-none mt-0.5">{d.num}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aulas do dia */}
      <div className="flex flex-col gap-4">
        {AULAS_DIA.map((aula) => {
          const vagasLabel = `${aula.vagasDisp} vagas / ${aula.total}`
          const vagasClass = aula.vagasDisp === 0
            ? 'bg-red/15 text-red'
            : aula.vagasDisp <= 3
              ? 'bg-orange/15 text-orange-dk'
              : 'bg-green/15 text-green-dk'

          return (
            <div key={aula.nome} className="bg-white rounded-2xl border border-black/[0.04] shadow-sm p-5 flex items-center gap-5">
              {/* Horário */}
              <div className="flex-shrink-0 w-20">
                <p className="font-poppins text-lg font-extrabold text-purple leading-none">{aula.inicio}</p>
                <p className="text-[11px] text-gray-mid mt-0.5">até {aula.fim}</p>
              </div>

              <div className="w-px h-10 bg-black/8 flex-shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-poppins text-sm font-bold text-gray-dark">{aula.emoji} {aula.nome}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-gray-mid">👤 {aula.instrutor}</span>
                  <span className="text-xs text-gray-mid">📍 {aula.local}</span>
                </div>
              </div>

              {/* Vagas */}
              <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${vagasClass}`}>
                {vagasLabel}
              </span>

              {/* Ação */}
              {aula.inscrita ? (
                <span className="text-xs font-bold px-4 py-2 rounded-xl bg-purple/10 text-purple flex-shrink-0">✓ Inscrita</span>
              ) : aula.vagasDisp === 0 ? (
                <button className="text-xs font-bold px-4 py-2 rounded-xl border border-[#E8E8F0] text-gray-mid flex-shrink-0 hover:border-purple hover:text-purple transition-colors">
                  Lista de espera
                </button>
              ) : (
                <button className="text-xs font-bold px-4 py-2 rounded-xl bg-purple text-white flex-shrink-0 hover:bg-purple-light transition-colors">
                  Inscrever-se
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
