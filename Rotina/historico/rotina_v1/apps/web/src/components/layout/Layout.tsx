// apps/web/src/components/layout/Layout.tsx
// Shell principal: topbar + sidebar + <Outlet /> (main)
// Replica fielmente a estrutura .shell do rotina_dashboard.html

import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  {
    section: 'Rotina',
    items: [
      { to: '/',             icon: 'ti-layout-dashboard', label: 'Dashboard' },
      { to: '/planejamento', icon: 'ti-layout-list',      label: 'Planejamento de Rotina' },
      { to: '/rotina-atual', icon: 'ti-calendar-event',   label: 'Rotina Atual' },
      { to: '/historico',    icon: 'ti-history',          label: 'Histórico' },
    ],
  },
  {
    section: 'Integrações',
    items: [
      { to: '/timer',  icon: 'ti-star',  label: 'Habitica' },
      { to: '/notas',  icon: 'ti-clock', label: 'Toggl' },
    ],
  },
  {
    section: 'Planilha',
    items: [
      { to: '/tarefas', icon: 'ti-list',   label: 'Tarefas' },
      { to: '/estudos', icon: 'ti-book-2', label: 'Plano de Estudos' },
    ],
  },
];

export function Layout() {
  return (
    <div className="shell">

      {/* ── TOPBAR ──────────────────────────────────────── */}
      <div className="topbar">
        <div className="logo">
          <i className="ti ti-calendar-check" />
          Rotina
          <span style={{ color: 'var(--purple-dim)', margin: '0 4px' }}>/</span>
          <span>Organização Pessoal</span>
        </div>
        <div className="dots">
          <span className="dot dot-ok" />
          <span className="dot-lbl">Hábitos</span>
          <span className="dot dot-ok" style={{ marginLeft: 6 }} />
          <span className="dot-lbl">Metas</span>
          <span className="dot dot-ok" style={{ marginLeft: 6 }} />
          <span className="dot-lbl">Timer</span>
        </div>
      </div>

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <div className="sidebar">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <span className="sec-label">{section}</span>
            {items.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <i className={`ti ${icon}`} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* ── MAIN ────────────────────────────────────────── */}
      <div className="main">
        <Outlet />
      </div>

    </div>
  );
}
