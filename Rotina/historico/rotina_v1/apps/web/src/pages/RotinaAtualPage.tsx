// apps/web/src/pages/RotinaAtualPage.tsx
// Migração fiel do bloco #p-ciclo do rotina_dashboard.html

import { useState, useCallback } from 'react';

type DiaSemana = '2ª' | '3ª' | '4ª' | '5ª' | '6ª' | 'Sáb' | 'Dom' | 'Todos';

interface LinhaRotina {
  id: number;
  dia: Exclude<DiaSemana, 'Todos'>;
  ini: string;
  fim: string;
  acao: string;
  ativ: string;
  tipo: string;
  prioridade: number;
  concluido: boolean;
}

const ORDEM_DIA: Record<string, number> = { '2ª':0,'3ª':1,'4ª':2,'5ª':3,'6ª':4,'Sáb':5,'Dom':6 };
const NOME_DIA: Record<string, string>  = { '2ª':'Segunda','3ª':'Terça','4ª':'Quarta','5ª':'Quinta','6ª':'Sexta','Sáb':'Sábado','Dom':'Domingo' };
const COR_DIA:  Record<string, string>  = { '2ª':'#7e57c2','3ª':'#26a69a','4ª':'#42a5f5','5ª':'#ffd54f','6ª':'#e91e8c','Sáb':'#ff9800','Dom':'#ef5350' };
const DIAS: DiaSemana[] = ['Todos','2ª','3ª','4ª','5ª','6ª','Sáb','Dom'];

export default function RotinaAtualPage() {
  const [filtro, setFiltro] = useState<DiaSemana>('Todos');
  const [rotina, setRotina] = useState<LinhaRotina[]>([]);
  const [feedback, setFeedback] = useState('');

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const gerarRotina = () => {
    showFeedback('⚠️ Defina blocos e tarefas na página "Planejamento de Rotina" antes de gerar.');
  };

  const toggleConcluido = useCallback((id: number) => {
    setRotina(prev => prev.map(r => r.id === id ? { ...r, concluido: !r.concluido } : r));
  }, []);

  const removerLinha = (id: number) => setRotina(prev => prev.filter(r => r.id !== id));

  const adicionarManual = () => {
    const nova: LinhaRotina = { id: Date.now(), dia: '2ª', ini: '07:00', fim: '08:00', acao: '—', ativ: 'Nova atividade', tipo: '—', prioridade: rotina.length + 1, concluido: false };
    setRotina(prev => [...prev, nova]);
    showFeedback('✎ Linha adicionada — edite diretamente na tabela.');
  };

  const filtradas = filtro === 'Todos' ? rotina : rotina.filter(r => r.dia === filtro);
  const sorted    = [...filtradas].sort((a, b) => (ORDEM_DIA[a.dia] ?? 9) - (ORDEM_DIA[b.dia] ?? 9) || a.ini.localeCompare(b.ini));

  // Mini gantt semanal
  const porAcao: Record<string, { total: number; dias: Set<string> }> = {};
  rotina.forEach(r => {
    if (!porAcao[r.acao]) porAcao[r.acao] = { total: 0, dias: new Set() };
    const [hI,mI] = r.ini.split(':').map(Number);
    const [hF,mF] = r.fim.split(':').map(Number);
    porAcao[r.acao]!.total += (hF! * 60 + mF!) - (hI! * 60 + mI!);
    porAcao[r.acao]!.dias.add(r.dia);
  });
  const totalMin = Object.values(porAcao).reduce((s, v) => s + v.total, 0) || 1;
  const CORES = ['#7e57c2','#26a69a','#e91e8c','#42a5f5','#ffd54f','#ff9800','#ef5350','#00bcd4'];

  return (
    <div className="page">
      {feedback && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--fg)', zIndex: 200 }}>
          {feedback}
        </div>
      )}

      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="ptitle"><span>Rotina</span> Atual</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="sub-tag">Bloco_13.07.2026</span>
          <button className="btn-mini" onClick={gerarRotina}>⟳ Gerar da Definição</button>
          <button className="btn-pink" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => showFeedback('✅ Rotina salva! Conecte ao servidor para sincronizar.')}>💾 Salvar no Sheets</button>
        </div>
      </div>

      {/* ── Filtro de dia ─────────────────────────────────── */}
      <div className="card-sm" style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--purple-dim)' }}>Visualizar dia:</div>
          <div className="dias-pills">
            {DIAS.map(d => (
              <div key={d} className={`dia-pill${filtro === d ? ' active' : ''}`} onClick={() => setFiltro(d)}>{d}</div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--purple-dim)' }}>{filtradas.length} atividade(s)</div>
        </div>
      </div>

      {/* ── Tabela ────────────────────────────────────────── */}
      <div className="acoes-table-wrap">
        <table className="acoes-table">
          <thead>
            <tr>
              <th style={{ width: 32, textAlign: 'center' }}>P</th>
              <th style={{ width: 40 }}>Dia</th>
              <th style={{ width: 70 }}>Início</th>
              <th style={{ width: 70 }}>Fim</th>
              <th>Ação</th>
              <th>Tarefa</th>
              <th style={{ width: 70 }}>Tipo</th>
              <th style={{ width: 28, textAlign: 'center' }}>✓</th>
              <th style={{ width: 28 }} />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ color: 'var(--purple-dim)', textAlign: 'center', padding: 20, fontSize: 12 }}>
                  Clique em <strong style={{ color: 'var(--pink-soft)' }}>⟳ Gerar da Definição</strong> para montar a rotina.<br />
                  <span style={{ fontSize: 10, opacity: .7 }}>Ou adicione manualmente uma linha abaixo.</span>
                </td>
              </tr>
            ) : (() => {
              let lastDia = '';
              return sorted.map(r => {
                const newDia = r.dia !== lastDia;
                lastDia = r.dia;
                const cor = COR_DIA[r.dia] ?? 'var(--purple-dim)';
                return [
                  newDia && filtro === 'Todos' && (
                    <tr key={`sep-${r.id}`}>
                      <td colSpan={9} style={{ background: 'rgba(74,32,128,.3)', padding: '4px 10px', fontSize: 10, fontWeight: 600, color: cor, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        {NOME_DIA[r.dia]}
                      </td>
                    </tr>
                  ),
                  <tr key={r.id} style={r.concluido ? { opacity: .5 } : undefined}>
                    <td style={{ textAlign: 'center', color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r.prioridade}</td>
                    <td><span style={{ background: `${cor}22`, color: cor, borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>{r.dia}</span></td>
                    <td><span className="hora-pill">{r.ini}</span></td>
                    <td><span className="hora-pill" style={{ background: 'rgba(233,30,140,.1)', color: 'var(--pink-soft)' }}>{r.fim}</span></td>
                    <td style={{ fontSize: 11, fontWeight: 500 }}>{r.acao}</td>
                    <td style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{r.ativ}</td>
                    <td style={{ fontSize: 10, color: 'var(--purple-text)' }}>{r.tipo}</td>
                    <td style={{ textAlign: 'center', cursor: 'pointer', fontSize: 14 }} onClick={() => toggleConcluido(r.id)}>
                      {r.concluido
                        ? <span style={{ color: '#26a69a' }}>✓</span>
                        : <span style={{ color: 'var(--border)' }}>○</span>}
                    </td>
                    <td><button className="btn-rm" onClick={() => removerLinha(r.id)}>✕</button></td>
                  </tr>,
                ];
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* ── Rodapé ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--purple-dim)' }}>P = Prioridade (sincroniza com Definir Tarefas)</span>
          <span style={{ fontSize: 10, color: 'var(--purple-dim)' }}>· ✓ = Concluído hoje</span>
        </div>
        <button className="btn-add-linha" onClick={adicionarManual}>＋ Adicionar manualmente</button>
      </div>

      {/* ── Mini Gantt semanal ────────────────────────────── */}
      {rotina.length > 0 && (
        <div className="card-sm">
          <div className="clabel" style={{ marginBottom: 8 }}>Visão Semanal — Ciclo de Rotina</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(porAcao).map(([acao, v], i) => {
              const pct  = Math.max(4, Math.round((v.total / totalMin) * 100));
              const h    = Math.floor(v.total / 60);
              const m    = v.total % 60;
              const cor  = CORES[i % CORES.length]!;
              return (
                <div key={acao} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 110, fontSize: 10, color: 'var(--purple-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={acao}>{acao}</div>
                  <div style={{ flex: 1, height: 16, background: 'var(--bg-deep)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 5px' }}>
                      <span style={{ fontSize: 9, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>{h}h{m ? `${m}m` : ''} · {[...v.dias].join(', ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
