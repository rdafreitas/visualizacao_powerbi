// apps/web/src/pages/DashboardPage.tsx
// Migração fiel do bloco #p-dashboard do rotina_dashboard.html

import { useState, useCallback } from 'react';

// ── Tipos locais ──────────────────────────────────────────

type Resultado = '' | 'Feito completamente' | 'Feito parcialmente' | 'Não feito' | 'Adiado';
type ViewMode  = 'gantt' | 'indicadores';

interface Atividade {
  obj: string;
  hora: string;
  resultado: Resultado;
  aberto: boolean;
  togglLabel: string;
}

interface ColAtiv {
  periodo: 'Manhã' | 'Tarde' | 'Noite';
  dotClass: string;
  icon: string;
  items: Omit<Atividade, 'resultado' | 'aberto'>[];
}

// ── Dados estáticos (virão da API futuramente) ────────────

const COLUNAS: ColAtiv[] = [
  {
    periodo: 'Manhã', dotClass: 'dot-manha', icon: 'ti-user',
    items: [
      { obj: 'Ficar com Leleca/Casa',         hora: '07:00', togglLabel: 'Ficar com Leleca/Casa' },
      { obj: 'Musculação - A - Superiores',    hora: '07:15', togglLabel: 'Musculação - A - Superiores' },
      { obj: 'Pós-Grad — Linguagem de Prog.',  hora: '08:30', togglLabel: 'Pós-Graduação' },
    ],
  },
  {
    periodo: 'Tarde', dotClass: 'dot-tarde', icon: 'ti-sun',
    items: [
      { obj: 'Demandas — Diárias',             hora: '09:00', togglLabel: 'Demandas - Diárias' },
      { obj: 'Mudança Pontual — Diário',        hora: '13:30', togglLabel: 'Ajuste dos Planos - Mudança Pontual' },
      { obj: 'Demandas — Diárias (tarde)',      hora: '14:00', togglLabel: 'Demandas - Diárias tarde' },
    ],
  },
  {
    periodo: 'Noite', dotClass: 'dot-noite', icon: 'ti-moon',
    items: [
      { obj: 'Resumo/Leitura — Concurso',      hora: '20:00', togglLabel: 'Resumo/Leitura - Concurso' },
      { obj: 'Desativar (Sair do PC)',          hora: '22:00', togglLabel: 'Higiene do Sono - Desativar' },
      { obj: 'Livro / Meditação',              hora: '22:40', togglLabel: 'Higiene do Sono - Livro/Meditação' },
    ],
  },
];

const RESULTADO_CLASS: Record<Resultado, string> = {
  '':                   '',
  'Feito completamente': 'feito',
  'Feito parcialmente':  'parcial',
  'Não feito':           'nao-feito',
  'Adiado':              'adiado',
};

// ── Componente Coluna de Atividades ───────────────────────

function ColunaAtividades({ col, atividades, onToggle, onResultado }:
  {
    col: ColAtiv;
    atividades: Atividade[];
    onToggle: (i: number) => void;
    onResultado: (i: number, v: Resultado) => void;
  }) {
  return (
    <div className="ativ-col">
      <div className="ativ-col-header">
        <i className={`ti ${col.icon}`} style={{ fontSize: 11, color: 'var(--purple-text)' }} />
        <span className={`dot-periodo ${col.dotClass}`} />
        {col.periodo}
      </div>
      {atividades.map((a, i) => (
        <div key={i}>
          <button className={`ativ-item${a.aberto ? ' open' : ''}`} onClick={() => onToggle(i)}>
            <span className="ativ-obj">{a.obj}</span>
            <span className="ativ-hora">{a.hora}</span>
            <span className="ativ-arrow">▶</span>
          </button>
          <div className={`ativ-drawer${a.aberto ? ' open' : ''}`}>
            <div className="ativ-drawer-inner">
              <select
                className={`ativ-select ${RESULTADO_CLASS[a.resultado]}`}
                value={a.resultado}
                onChange={e => onResultado(i, e.target.value as Resultado)}
              >
                <option value="">O que foi feito?</option>
                <option>Feito completamente</option>
                <option>Feito parcialmente</option>
                <option>Não feito</option>
                <option>Adiado</option>
              </select>
              <button
                className="ativ-toggl-btn"
                onClick={() => window.open('https://toggl.com/app/timer', '_blank')}
              >
                ⏱ Registrar no Toggl
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────

export default function DashboardPage() {
  const [view, setView] = useState<ViewMode>('gantt');

  // Estado das atividades por coluna (índice 0=Manhã, 1=Tarde, 2=Noite)
  const [atividades, setAtividades] = useState<Atividade[][]>(
    COLUNAS.map(col =>
      col.items.map(it => ({ ...it, resultado: '' as Resultado, aberto: false }))
    )
  );

  const handleToggle = useCallback((colIdx: number, itemIdx: number) => {
    setAtividades(prev =>
      prev.map((col, ci) =>
        ci !== colIdx
          ? col
          : col.map((a, ai) => ({
              ...a,
              // fecha todos, abre o clicado (se estava fechado)
              aberto: ai === itemIdx ? !a.aberto : false,
            }))
      )
    );
  }, []);

  const handleResultado = useCallback((colIdx: number, itemIdx: number, valor: Resultado) => {
    setAtividades(prev =>
      prev.map((col, ci) =>
        ci !== colIdx
          ? col
          : col.map((a, ai) => (ai === itemIdx ? { ...a, resultado: valor } : a))
      )
    );
  }, []);

  return (
    <div className="page">

      {/* ── Habitica Hero + Atividades do Dia ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 8, alignItems: 'start' }}>

        {/* Hero Habitica */}
        <div className="hab-hero" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
            <div className="hab-avatar">⚔️</div>
            <div className="hab-info">
              <div className="hab-name">Renan D'Alexandro</div>
              <div className="hab-level">Level 24 · Warrior</div>
            </div>
          </div>
          <div className="hab-bars" style={{ width: '100%' }}>
            <div className="hab-bar-row">
              <span className="hab-bar-icon">❤️</span>
              <div className="hab-bar-track"><div className="hab-bar-fill hp" style={{ width: '52%' }} /></div>
              <span className="hab-bar-val">47/90</span>
            </div>
            <div className="hab-bar-row">
              <span className="hab-bar-icon">💧</span>
              <div className="hab-bar-track"><div className="hab-bar-fill mp" style={{ width: '68%' }} /></div>
              <span className="hab-bar-val">61/90</span>
            </div>
            <div className="hab-bar-row">
              <span className="hab-bar-icon">⭐</span>
              <div className="hab-bar-track"><div className="hab-bar-fill exp" style={{ width: '35%' }} /></div>
              <span className="hab-bar-val">350/1k</span>
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, width: '100%' }}>
            <div style={{ flex: 1, background: 'var(--bg-deep)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '5px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--purple-dim)' }}>Gold</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#ffd54f' }}>312 GP</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-deep)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '5px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--purple-dim)' }}>Streaks</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--pink)' }}>🔥 7</div>
            </div>
          </div>
        </div>

        {/* Colunas de Atividades */}
        <div className="ativ-cols">
          {COLUNAS.map((col, ci) => (
            <ColunaAtividades
              key={col.periodo}
              col={col}
              atividades={atividades[ci]!}
              onToggle={i => handleToggle(ci, i)}
              onResultado={(i, v) => handleResultado(ci, i, v)}
            />
          ))}
        </div>
      </div>

      {/* ── Toggle Gantt / Indicadores ────────────────────── */}
      <div className="dash-view-toggle">
        <button
          className={`dash-view-btn${view === 'gantt' ? ' active' : ''}`}
          onClick={() => setView('gantt')}
        >
          📊 Acompanhe seu planejamento
        </button>
        <button
          className={`dash-view-btn${view === 'indicadores' ? ' active' : ''}`}
          onClick={() => setView('indicadores')}
        >
          📈 Avalie sua evolução
        </button>
      </div>

      {/* ── Painel Gantt ──────────────────────────────────── */}
      <div className={`dash-view-panel${view === 'gantt' ? ' active' : ''}`}>
        <div className="gantt-wrap">
          <div className="gantt-title">
            Gráfico de Gantt — Ações do Bloco_01/06/26 · Ciclo 3º Trimestre: Jul → Set 2026
          </div>
          <div className="gantt-head">
            <div className="gantt-head-spacer" />
            <div className="gantt-months">
              {['Jul', 'Ago', 'Set'].map(m => <div key={m} className="gantt-month">{m}</div>)}
            </div>
          </div>
          <div className="gantt-grid">
            {/* Marcador "Hoje" */}
            <div className="gantt-row" style={{ marginBottom: -2, pointerEvents: 'none' }}>
              <div style={{ width: 120, flexShrink: 0 }} />
              <div style={{ flex: 1, position: 'relative', height: 6 }}>
                <div style={{ position: 'absolute', left: '3.7%', top: -4, width: 1.5, height: 220, background: 'rgba(233,30,140,.55)', zIndex: 5 }} />
                <span style={{ position: 'absolute', left: '4%', top: 0, fontSize: 8, color: 'var(--pink-soft)' }}>Hoje</span>
              </div>
            </div>
            {/* Barras */}
            {[
              { label: '🔴 Dores · Musc. A/B',       cor: 'linear-gradient(90deg,#ef5350,#c62828)', txt: 'Reavaliar', badge: 'badge-fl',  w: 14 },
              { label: '🔴 Cargo · Python/DevOps',    cor: 'linear-gradient(90deg,#e91e8c,#880e4f)', txt: 'Reavaliar', badge: 'badge-fl',  w: 14 },
              { label: '🔴 Qualif. TI · Pós-Grad',   cor: 'linear-gradient(90deg,#ab47bc,#6a1b9a)', txt: 'Reavaliar', badge: 'badge-fl',  w: 14 },
              { label: '🟡 Melhorar Exame · Esportes',cor: 'linear-gradient(90deg,#42a5f5,#1565c0)', txt: 'Próximo',   badge: 'badge-re',  w: 14 },
              { label: '✅ Pós-Grad 01 · Intro IA',   cor: 'linear-gradient(90deg,#26a69a,#004d40)', txt: 'Concluído', badge: 'badge-ok',  w: 4  },
              { label: '🟢 Hábitos Saudáveis',        cor: 'linear-gradient(90deg,#7e57c2,#311b92)', txt: 'Permanente · ano todo', badge: 'badge-ok', w: 100 },
              { label: '🟢 Tarefa Work · Daily',      cor: 'linear-gradient(90deg,#00bcd4,#006064)', txt: 'Permanente · ano todo', badge: 'badge-ok', w: 100 },
              { label: '🟢 Afinidade · Juntinho',     cor: 'linear-gradient(90deg,#f06cb8,#880e4f)', txt: 'Permanente · ano todo', badge: 'badge-ok', w: 100 },
              { label: '🟢 Lazer · Jogos',            cor: 'linear-gradient(90deg,#ffd54f,#e65100)', txt: 'Permanente · ano todo', badge: 'badge-ok', w: 100 },
            ].map(({ label, cor, txt, badge, w }) => (
              <div key={label} className="gantt-row">
                <div className="gantt-label" title={label}>{label}</div>
                <div className="gantt-track">
                  <div className="gantt-bar" style={{ left: 0, width: `${w}%`, background: cor }}>{txt}</div>
                </div>
                <span className={`gantt-badge badge ${badge}`}>{txt.split('·')[0]}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 9, color: 'var(--purple-dim)' }}>
              🔴 Alta prioridade &nbsp;·&nbsp; 🟡 Próximo &nbsp;·&nbsp; ✅ Concluído &nbsp;·&nbsp; 🟢 Permanente &nbsp;·&nbsp;
              <span style={{ color: 'rgba(233,30,140,.8)' }}>│</span> Hoje 11/jul
            </span>
          </div>
        </div>
      </div>

      {/* ── Painel Indicadores ────────────────────────────── */}
      <div className={`dash-view-panel${view === 'indicadores' ? ' active' : ''}`}>
        <div className="indicadores-grid">
          {[
            { cls: 'ok',    icon: '🎯', label: 'Ações Ativas no Bloco',  val: '13',       valCls: 'green',  desc: 'Do total de ações cadastradas (Permanentes + Bloco_01/06/26)' },
            { cls: 'alert', icon: '⚠️', label: 'Em Reavaliar',            val: '3',        valCls: 'red',    desc: 'Dores no Corpo · Cargo Melhor · Qualificação TI — precisam de atenção' },
            { cls: 'ok',    icon: '✅', label: 'Ação Concluída',           val: '1',        valCls: 'green',  desc: 'Pós-Graduação — 01. Intro sobre IA · concluída em 02/fev' },
            { cls: 'warn',  icon: '🔜', label: 'Próximas a Iniciar',       val: '5',        valCls: 'yellow', desc: 'Melhorar Exame: Cross Fit, Futevôlei, Beach Tennis, Natação, Pilates' },
            { cls: 'ok',    icon: '📅', label: 'Ciclo Atual',              val: '3º Trim.', valCls: 'blue',   desc: '01/07/2026 → 30/09/2026 · Foco: Carreira + Saúde + Família', small: true },
            { cls: 'warn',  icon: '📦', label: 'No Backlog',               val: '14',       valCls: 'yellow', desc: 'Ações planejadas para blocos futuros (Pós-Grad 03–06, LinkedIn, Concurso BACEN…)' },
          ].map(({ cls, icon, label, val, valCls, desc, small }) => (
            <div key={label} className={`ind-card ${cls}`}>
              <div className="ind-header">
                <span className="ind-label">{label}</span>
                <span className="ind-icon">{icon}</span>
              </div>
              <div className={`ind-val ${valCls}`} style={small ? { fontSize: 14 } : undefined}>{val}</div>
              <div className="ind-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
