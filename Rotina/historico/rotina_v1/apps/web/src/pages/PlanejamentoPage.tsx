// apps/web/src/pages/PlanejamentoPage.tsx
// Migração fiel do bloco #p-habitos do rotina_dashboard.html

import { useState, useCallback } from 'react';

// ── Tipos ─────────────────────────────────────────────────

type PlanTab = 'definir-acoes' | 'editar-blocos' | 'definir-tarefas';
type DiaSemana = '2ª' | '3ª' | '4ª' | '5ª' | '6ª' | 'Sáb' | 'Dom';
type StatusAcao = 'Reavaliar' | 'Próximo' | 'Ativo' | 'Permanente' | 'Backlog';
type TipoAtividade = 'Videoaula' | 'Resumo/Leitura' | 'Exercício/Questões' | 'Revisão' | 'Projeto' | 'Treino/Prática' | 'Reunião' | 'Rotineira' | 'A definir/Flexível';
type DuracaoUnidade = 'dias' | 'semanas' | 'meses';

interface AcaoBloco { abrev: string; prioritaria: boolean; }
interface HorarioBloco { num: number; acao: string; dia: DiaSemana; ini: string; fim: string; dif: string; }
interface TarefaBloco { id: number; acao: string; tipo: string; local: string; ativ: string; prioridade: number; dias: number; vinculadas: number[]; }

interface ModalMeta  { meta: string; categoria: string; abrev: string; data: string; status: string; objetivo: string; }
interface ModalAcao  { idMeta: string; registro: string; categoria: string; abrev: string; foco: string; tipo: string; prazIni: string; prazFim: string; status: string; ipc: string; objetivo: string; }

// ── Dados das ações disponíveis ───────────────────────────

const ACOES_DISPONIVEIS: { abrev: string; foco: string; status: StatusAcao }[] = [
  { abrev: 'Dores no Corpo',    foco: 'Musculação A/B · Joelho/Lombar',            status: 'Reavaliar'  },
  { abrev: 'Melhorar Exame',    foco: 'Cross Fit · Futevôlei · Natação · Pilates', status: 'Próximo'    },
  { abrev: 'Concurso',          foco: 'Resumo/Leitura · Questões (Câm. Dep)',       status: 'Ativo'      },
  { abrev: 'Cargo Melhor',      foco: 'Python · DevOps · Agente PBI · LinkedIn',   status: 'Reavaliar'  },
  { abrev: 'Estudos TI',        foco: 'Pós-Graduação · Ciência de Dados',           status: 'Reavaliar'  },
  { abrev: 'Hábitos Saudáveis', foco: 'Higiene do Sono · Rotina de Ativação',       status: 'Permanente' },
  { abrev: 'Lazer',             foco: 'Roguelike · Co-op com os Parças',            status: 'Permanente' },
  { abrev: 'Afinidade Relação', foco: 'Tempo Útil · Juntinho · Compromissos',       status: 'Permanente' },
  { abrev: 'Tarefa - Work',     foco: 'Daily · Demandas · Reuniões',                status: 'Permanente' },
  { abrev: 'Tarefa - Casa',     foco: 'Organização · Manutenção · Planejamento',    status: 'Permanente' },
];

const TIPOS_ATIVIDADE: TipoAtividade[] = [
  'Videoaula', 'Resumo/Leitura', 'Exercício/Questões', 'Revisão',
  'Projeto', 'Treino/Prática', 'Reunião', 'Rotineira', 'A definir/Flexível',
];

const BADGE: Record<StatusAcao, string> = {
  Reavaliar: 'badge-fl', Próximo: 'badge-re', Ativo: 'badge-ok', Permanente: 'badge-ok', Backlog: 'badge-ab',
};

const DIAS: DiaSemana[] = ['2ª', '3ª', '4ª', '5ª', '6ª', 'Sáb', 'Dom'];

// ── Utilitários ───────────────────────────────────────────

function calcDif(ini: string, fim: string): string {
  if (!ini || !fim) return '';
  const [hI, mI] = ini.split(':').map(Number);
  const [hF, mF] = fim.split(':').map(Number);
  let d = (hF! * 60 + mF!) - (hI! * 60 + mI!);
  if (d < 0) d += 1440;
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
}

function gerarNomeBloco(dataIni: string, duracao: string, unidade: DuracaoUnidade): string {
  if (!dataIni) return '—';
  const d = new Date(dataIni + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const nome = `Bloco_${dd}.${mm}.${d.getFullYear()}`;
  return nome + (duracao ? ` · ${duracao} ${unidade}` : '');
}

// ── Componente principal ──────────────────────────────────

export default function PlanejamentoPage() {
  const [tab, setTab] = useState<PlanTab>('definir-acoes');

  // ── Estado: Definir Ações ─────────────────────────────
  const [dataIni, setDataIni]   = useState('');
  const [duracao, setDuracao]   = useState('');
  const [unidade, setUnidade]   = useState<DuracaoUnidade>('dias');
  const [acoesBloco, setAcoesBloco] = useState<AcaoBloco[]>([]);

  const adicionarAcao = () => {
    if (acoesBloco.length >= 15) return;
    setAcoesBloco(prev => [...prev, { abrev: '', prioritaria: false }]);
  };
  const removerAcao = (i: number) => setAcoesBloco(prev => prev.filter((_, idx) => idx !== i));
  const setAcaoAbrev = (i: number, v: string) =>
    setAcoesBloco(prev => prev.map((a, idx) => idx === i ? { ...a, abrev: v } : a));
  const togglePrior = (i: number) =>
    setAcoesBloco(prev => prev.map((a, idx) => idx === i ? { ...a, prioritaria: !a.prioritaria } : a));

  // ── Estado: Editar Blocos ─────────────────────────────
  const [diaSel, setDiaSel]         = useState<DiaSemana | ''>('');
  const [ebAcao, setEbAcao]         = useState('');
  const [ebIni, setEbIni]           = useState('');
  const [ebFim, setEbFim]           = useState('');
  const [ebNum, setEbNum]           = useState('');
  const [horariosBloco, setHorariosBloco] = useState<HorarioBloco[]>([]);

  const adicionarHorario = () => {
    if (!ebAcao || !ebIni || !ebFim || !diaSel) return;
    const dif = calcDif(ebIni, ebFim);
    const h: HorarioBloco = { num: parseInt(ebNum) || horariosBloco.length + 1, acao: ebAcao, dia: diaSel, ini: ebIni, fim: ebFim, dif };
    const sorted = [...horariosBloco, h].sort((a, b) => a.ini.localeCompare(b.ini));
    setHorariosBloco(sorted);
    setEbAcao(''); setEbIni(''); setEbFim(''); setEbNum('');
  };
  const removerHorario = (i: number) => setHorariosBloco(prev => prev.filter((_, idx) => idx !== i));

  // ── Estado: Definir Tarefas ───────────────────────────
  const [dtAcao, setDtAcao]   = useState('');
  const [dtTipo, setDtTipo]   = useState<TipoAtividade>('Rotineira');
  const [dtLocal, setDtLocal] = useState('');
  const [dtAtiv, setDtAtiv]   = useState('');
  const [dtPrio, setDtPrio]   = useState('');
  const [dtDias, setDtDias]   = useState('');
  const [tarefasBloco, setTarefasBloco] = useState<TarefaBloco[]>([]);
  const [feedback, setFeedback] = useState('');

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const adicionarTarefa = useCallback(() => {
    if (!dtAcao || !dtAtiv) { showFeedback('⚠️ Preencha: Ação e Atividade.'); return; }
    const prio = parseInt(dtPrio);
    if (!prio || prio < 1) { showFeedback('⚠️ Defina uma Prioridade válida (≥ 1).'); return; }
    const conflito = tarefasBloco.find(t => t.acao === dtAcao && t.prioridade === prio);
    if (conflito) { showFeedback(`⚠️ "${dtAcao}" já tem prioridade ${prio}: "${conflito.ativ}"`); return; }
    const nova: TarefaBloco = { id: Date.now(), acao: dtAcao, tipo: dtTipo, local: dtLocal, ativ: dtAtiv, prioridade: prio, dias: parseInt(dtDias) || 1, vinculadas: [] };
    setTarefasBloco(prev => [...prev, nova].sort((a, b) => a.acao.localeCompare(b.acao) || a.prioridade - b.prioridade));
    setDtAcao(''); setDtTipo('Rotineira'); setDtLocal(''); setDtAtiv(''); setDtPrio(''); setDtDias('');
    showFeedback('✅ Tarefa adicionada!');
  }, [dtAcao, dtTipo, dtLocal, dtAtiv, dtPrio, dtDias, tarefasBloco]);

  const removerTarefa = (i: number) => setTarefasBloco(prev => prev.filter((_, idx) => idx !== i));

  // ── Modais (estado simples) ───────────────────────────
  const [modalMeta, setModalMeta]   = useState(false);
  const [modalAcao, setModalAcao]   = useState(false);
  const [modalTarefa, setModalTarefa] = useState(false);

  const nomeBloco = gerarNomeBloco(dataIni, duracao, unidade);
  const prioUsadas = tarefasBloco.filter(t => t.acao === dtAcao).map(t => t.prioridade).sort((a,b)=>a-b);

  return (
    <div className="page">

      {/* Feedback toast */}
      {feedback && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--fg)', zIndex: 200 }}>
          {feedback}
        </div>
      )}

      {/* ── Topo ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="ptitle"><span>Planejamento</span> de Rotina</div>
        <div className="plan-top-btns">
          <button className="btn-plan meta"   onClick={() => setModalMeta(true)}>＋ Add Meta</button>
          <button className="btn-plan acao"   onClick={() => setModalAcao(true)}>＋ Add Ação</button>
          <button className="btn-plan tarefa" onClick={() => setModalTarefa(true)}>＋ Add Tarefa</button>
        </div>
      </div>

      <hr className="plan-divider" />

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="plan-tabs">
        {([
          ['definir-acoes',   'ti-adjustments-horizontal', 'Definir Ações'],
          ['editar-blocos',   'ti-clock-edit',             'Editar Blocos'],
          ['definir-tarefas', 'ti-list-check',             'Definir Tarefas'],
        ] as [PlanTab, string, string][]).map(([id, icon, label]) => (
          <button
            key={id}
            className={`plan-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 12 }} /> {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          PAINEL 1 — DEFINIR AÇÕES
      ════════════════════════════════════════════════════ */}
      <div className={`plan-panel${tab === 'definir-acoes' ? ' active' : ''}`}>

        {/* Cabeçalho do bloco */}
        <div className="card-sm">
          <div className="clabel" style={{ marginBottom: 8 }}>Período do Bloco</div>
          <div className="form-grid">
            <div className="fg">
              <label>Data Inicial</label>
              <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <div className="fg" style={{ flex: 1 }}>
                <label>Duração</label>
                <input type="number" min={1} placeholder="Ex: 5" value={duracao} onChange={e => setDuracao(e.target.value)} />
              </div>
              <div className="fg" style={{ flex: 1 }}>
                <label>Unidade</label>
                <select value={unidade} onChange={e => setUnidade(e.target.value as DuracaoUnidade)}>
                  <option value="dias">Dias</option>
                  <option value="semanas">Semanas</option>
                  <option value="meses">Meses</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--purple-dim)' }}>Nome do Bloco:</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--pink-soft)', background: 'rgba(233,30,140,.1)', padding: '2px 8px', borderRadius: 4 }}>
              {nomeBloco}
            </span>
          </div>
        </div>

        {/* Tabela de ações */}
        <div className="card-sm" style={{ paddingBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="clabel">Ações do Bloco <span style={{ color: 'var(--purple-dim)' }}>({acoesBloco.length}/15)</span></div>
            <button className="btn-add-linha" onClick={adicionarAcao}>＋ Adicionar Ação</button>
          </div>
          <div className="acoes-table-wrap">
            <table className="acoes-table">
              <thead>
                <tr>
                  <th style={{ width: 24, textAlign: 'center' }} title="Prioritária">⭐</th>
                  <th>Ação (Abreviação)</th>
                  <th style={{ width: 110 }}>Foco / Registro</th>
                  <th style={{ width: 70 }}>Status</th>
                  <th style={{ width: 28 }} />
                </tr>
              </thead>
              <tbody>
                {acoesBloco.length === 0 ? (
                  <tr><td colSpan={5} style={{ color: 'var(--purple-dim)', textAlign: 'center', padding: 14 }}>Clique em "＋ Adicionar Ação" para começar</td></tr>
                ) : acoesBloco.map((a, i) => {
                  const info = ACOES_DISPONIVEIS.find(o => o.abrev === a.abrev);
                  return (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" className="vinc-check" checked={a.prioritaria} onChange={() => togglePrior(i)} />
                      </td>
                      <td>
                        <select className="acoes-row-select" value={a.abrev} onChange={e => setAcaoAbrev(i, e.target.value)}>
                          <option value="">Selecione...</option>
                          {ACOES_DISPONIVEIS.map(o => <option key={o.abrev} value={o.abrev}>{o.abrev}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: 10, color: 'var(--purple-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info?.foco ?? '—'}</td>
                      <td>{info ? <span className={`badge ${BADGE[info.status]}`}>{info.status}</span> : '—'}</td>
                      <td><button className="btn-rm" onClick={() => removerAcao(i)}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--purple-dim)' }}>⭐ = Ação prioritária neste bloco · máx. 15 ações</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-mini" onClick={() => setAcoesBloco([])}>↺ Limpar</button>
              <button className="btn-pink" onClick={() => showFeedback('✅ Ações salvas! Conecte ao servidor para sincronizar.')}>💾 Salvar no Sheets</button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          PAINEL 2 — EDITAR BLOCOS
      ════════════════════════════════════════════════════ */}
      <div className={`plan-panel${tab === 'editar-blocos' ? ' active' : ''}`}>

        {/* Seletor de dia */}
        <div className="card-sm">
          <div className="clabel" style={{ marginBottom: 8 }}>Dia da Semana</div>
          <div className="dias-pills">
            {DIAS.map(d => (
              <div key={d} className={`dia-pill${diaSel === d ? ' active' : ''}`} onClick={() => setDiaSel(d)}>{d}</div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--purple-dim)' }}>
            Dia selecionado: <span style={{ color: 'var(--pink-soft)' }}>{diaSel || 'Nenhum'}</span>
          </div>
        </div>

        {/* Formulário horário */}
        <div className="card-sm">
          <div className="clabel" style={{ marginBottom: 8 }}>Adicionar Horário</div>
          <div className="form-grid">
            <div className="fg full">
              <label>Ação (Abreviação)</label>
              <select value={ebAcao} onChange={e => setEbAcao(e.target.value)}>
                <option value="">Selecione a ação...</option>
                {ACOES_DISPONIVEIS.map(o => <option key={o.abrev} value={o.abrev}>{o.abrev}</option>)}
              </select>
            </div>
            <div className="fg"><label>Horário Inicial</label><input type="time" value={ebIni} onChange={e => setEbIni(e.target.value)} /></div>
            <div className="fg"><label>Horário Final</label><input type="time" value={ebFim} onChange={e => setEbFim(e.target.value)} /></div>
            <div className="fg"><label>Diferença</label><input type="text" readOnly value={calcDif(ebIni, ebFim)} style={{ color: 'var(--teal)' }} placeholder="00:00" /></div>
            <div className="fg"><label>Nº (ordem)</label><input type="number" min={1} placeholder="1" value={ebNum} onChange={e => setEbNum(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-add-linha" onClick={adicionarHorario}>＋ Adicionar à tabela</button>
          </div>
        </div>

        {/* Tabela horários */}
        <div className="acoes-table-wrap">
          <table className="acoes-table">
            <thead><tr><th>Nº</th><th>Ação</th><th>Dia</th><th>Início</th><th>Fim</th><th>Duração</th><th style={{ width: 28 }} /></tr></thead>
            <tbody>
              {horariosBloco.length === 0 ? (
                <tr><td colSpan={7} style={{ color: 'var(--purple-dim)', textAlign: 'center', padding: 14 }}>Nenhum horário definido ainda</td></tr>
              ) : horariosBloco.map((h, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--purple-dim)', fontFamily: 'var(--font-mono)' }}>{h.num}</td>
                  <td style={{ fontSize: 11 }}>{h.acao}</td>
                  <td><span style={{ background: 'rgba(74,32,128,.3)', borderRadius: 3, padding: '1px 6px', fontSize: 10, color: 'var(--purple-text)' }}>{h.dia}</span></td>
                  <td><span className="hora-pill">{h.ini}</span></td>
                  <td><span className="hora-pill">{h.fim}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--purple-dim)' }}>{h.dif}</td>
                  <td><button className="btn-rm" onClick={() => removerHorario(i)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-mini" onClick={() => setHorariosBloco([])}>↺ Limpar</button>
          <button className="btn-pink" onClick={() => showFeedback('✅ Blocos salvos! Conecte ao servidor para sincronizar.')}>💾 Salvar no Sheets</button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          PAINEL 3 — DEFINIR TAREFAS
      ════════════════════════════════════════════════════ */}
      <div className={`plan-panel${tab === 'definir-tarefas' ? ' active' : ''}`}>

        {/* Formulário */}
        <div className="card-sm">
          <div className="clabel" style={{ marginBottom: 8 }}>Nova Tarefa</div>
          <div className="form-grid">
            <div className="fg full">
              <label>Ação (Abreviação)</label>
              <select value={dtAcao} onChange={e => setDtAcao(e.target.value)}>
                <option value="">Selecione a ação...</option>
                {ACOES_DISPONIVEIS.map(o => <option key={o.abrev} value={o.abrev}>{o.abrev}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Tipo de Atividade</label>
              <select value={dtTipo} onChange={e => setDtTipo(e.target.value as TipoAtividade)}>
                {TIPOS_ATIVIDADE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg"><label>Local / Plataforma</label><input type="text" placeholder="Ex: Udemy, Notion, Academia…" value={dtLocal} onChange={e => setDtLocal(e.target.value)} /></div>
            <div className="fg full"><label>Atividade (descrição)</label><input type="text" placeholder="Ex: Aula 1.1 — Fundamentos de Python" value={dtAtiv} onChange={e => setDtAtiv(e.target.value)} /></div>
            <div className="fg">
              <label>Prioridade <span style={{ color: 'var(--purple-dim)', fontSize: 10 }}>{prioUsadas.length ? `(em uso: ${prioUsadas.join(', ')})` : ''}</span></label>
              <input type="number" min={1} max={99} placeholder="Ex: 1" value={dtPrio} onChange={e => setDtPrio(e.target.value)} />
            </div>
            <div className="fg"><label>Dias para Concluir</label><input type="number" min={1} placeholder="Ex: 3" value={dtDias} onChange={e => setDtDias(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-add-linha" onClick={adicionarTarefa}>＋ Adicionar à tabela</button>
          </div>
        </div>

        {/* Tabela de tarefas */}
        <div className="acoes-table-wrap">
          <table className="acoes-table">
            <thead>
              <tr>
                <th style={{ width: 32, textAlign: 'center' }}>P</th>
                <th>Ação</th><th>Tipo</th><th>Atividade</th>
                <th style={{ width: 60 }}>Dias</th>
                <th style={{ width: 28 }} />
              </tr>
            </thead>
            <tbody>
              {tarefasBloco.length === 0 ? (
                <tr><td colSpan={6} style={{ color: 'var(--purple-dim)', textAlign: 'center', padding: 14 }}>Nenhuma tarefa definida ainda</td></tr>
              ) : (() => {
                let lastAcao = '';
                return tarefasBloco.map((t, i) => {
                  const newAcao = t.acao !== lastAcao;
                  lastAcao = t.acao;
                  return [
                    newAcao && (
                      <tr key={`sep-${i}`}>
                        <td colSpan={6} style={{ background: 'rgba(74,32,128,.25)', padding: '3px 8px', fontSize: 10, color: 'var(--pink-soft)', fontWeight: 500, letterSpacing: '.05em' }}>{t.acao}</td>
                      </tr>
                    ),
                    <tr key={t.id}>
                      <td style={{ textAlign: 'center', color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.prioridade}</td>
                      <td style={{ fontSize: 10, color: 'var(--purple-dim)' }}>{t.acao}</td>
                      <td style={{ fontSize: 10, color: 'var(--purple-text)' }}>{t.tipo}</td>
                      <td style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }} title={t.ativ}>{t.ativ}</td>
                      <td style={{ fontSize: 10, color: 'var(--purple-text)', textAlign: 'center' }}>{t.dias}d</td>
                      <td><button className="btn-rm" onClick={() => removerTarefa(i)}>✕</button></td>
                    </tr>,
                  ];
                });
              })()}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--purple-dim)' }}>P = Prioridade · única por ação</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-mini" onClick={() => setTarefasBloco([])}>↺ Limpar</button>
            <button className="btn-pink" onClick={() => showFeedback('✅ Tarefas salvas! Conecte ao servidor para sincronizar.')}>💾 Salvar no Sheets</button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MODAIS
      ════════════════════════════════════════════════════ */}

      {/* Modal Meta */}
      {modalMeta && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModalMeta(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title"><span>Add</span> Meta → aba META</span>
              <button className="modal-close" onClick={() => setModalMeta(false)}>✕</button>
            </div>
            <div className="modal-form-grid">
              <div className="fg full"><label>Meta (objetivo principal)</label><input type="text" placeholder="Ex: Passar no Concurso Público" /></div>
              <div className="fg"><label>Categoria</label><select><option>Saúde/Bem-estar</option><option>Carreira Profissional</option><option>Família/Relacionamentos</option><option>Rotinas</option><option>Finanças</option></select></div>
              <div className="fg"><label>Abreviação</label><input type="text" placeholder="Ex: Concurso" /></div>
              <div className="fg"><label>Data Cadastro</label><input type="date" /></div>
              <div className="fg"><label>Status</label><select><option>Ativo</option><option>Próximo</option><option>Reavaliar</option><option>Permanente</option><option>Backlog</option></select></div>
              <div className="fg full"><label>Objetivo explicativo</label><textarea placeholder="Descreva o que essa meta representa…" /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-mini" onClick={() => setModalMeta(false)}>Cancelar</button>
              <button className="btn-pink" onClick={() => { showFeedback('✅ Meta salva! Conecte ao servidor para sincronizar.'); setModalMeta(false); }}>💾 Salvar no Sheets</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ação */}
      {modalAcao && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModalAcao(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title"><span>Add</span> Ação → aba AÇÕES</span>
              <button className="modal-close" onClick={() => setModalAcao(false)}>✕</button>
            </div>
            <div className="modal-form-grid">
              <div className="fg full"><label>Meta vinculada (ID_Meta)</label><input type="text" placeholder="Ex: Fortalecer o joelho, lombar e mãos._01" /></div>
              <div className="fg full"><label>Registro / Nome da Ação</label><input type="text" placeholder="Ex: [Dores no Corpo] Musculação - A - Frontal [3ªS.]" /></div>
              <div className="fg"><label>Categoria</label><select><option>Saúde/Bem-estar</option><option>Carreira Profissional</option><option>Família/Relacionamentos</option><option>Rotinas</option></select></div>
              <div className="fg"><label>Abreviação</label><input type="text" placeholder="Ex: Dores no Corpo" /></div>
              <div className="fg"><label>Foco</label><input type="text" placeholder="Ex: A - Frontal [3ªS.]" /></div>
              <div className="fg"><label>Status</label><select><option>Reavaliar</option><option>Próximo</option><option>Ativo</option><option>Permanente</option><option>Backlog</option><option>Concluído</option></select></div>
              <div className="fg"><label>Prazo Inicial</label><input type="date" /></div>
              <div className="fg"><label>Prazo Final</label><input type="date" /></div>
              <div className="fg full"><label>Objetivo explicativo</label><textarea placeholder="Descreva o que esta ação envolve…" /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-mini" onClick={() => setModalAcao(false)}>Cancelar</button>
              <button className="btn-pink" onClick={() => { showFeedback('✅ Ação salva! Conecte ao servidor para sincronizar.'); setModalAcao(false); }}>💾 Salvar no Sheets</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarefa */}
      {modalTarefa && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModalTarefa(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title"><span>Add</span> Tarefa → aba TAREFAS</span>
              <button className="modal-close" onClick={() => setModalTarefa(false)}>✕</button>
            </div>
            <div className="modal-form-grid">
              <div className="fg full"><label>Ação vinculada</label><select><option value="">Selecione...</option>{ACOES_DISPONIVEIS.map(o => <option key={o.abrev} value={o.abrev}>{o.abrev}</option>)}</select></div>
              <div className="fg full"><label>Atividade (descrição)</label><input type="text" placeholder="Ex: Aula 1.1 — Fundamentos de Python" /></div>
              <div className="fg"><label>Tipo</label><select>{TIPOS_ATIVIDADE.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="fg"><label>Local / Plataforma</label><input type="text" placeholder="Ex: Udemy" /></div>
              <div className="fg"><label>Data de Início</label><input type="date" /></div>
              <div className="fg"><label>Dias para Concluir</label><input type="number" min={1} placeholder="3" /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-mini" onClick={() => setModalTarefa(false)}>Cancelar</button>
              <button className="btn-pink" onClick={() => { showFeedback('✅ Tarefa salva! Conecte ao servidor para sincronizar.'); setModalTarefa(false); }}>💾 Salvar no Sheets</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
