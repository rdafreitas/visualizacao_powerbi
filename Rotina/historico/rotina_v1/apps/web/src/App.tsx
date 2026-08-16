// apps/web/src/App.tsx

import { useEffect, lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { queryClient, restaurarCache, persistirCache } from './services/queryClient';
import { Layout } from './components/layout/Layout';

// Pages — lazy loading para code-splitting (cada página só carrega quando acessada)
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const PlanejamentoPage = lazy(() => import('./pages/PlanejamentoPage'));
const RotinaAtualPage  = lazy(() => import('./pages/RotinaAtualPage'));
const HistoricoPage    = lazy(() => import('./pages/HistoricoPage'));
const TimerPage        = lazy(() => import('./pages/TimerPage'));
const NotasPage        = lazy(() => import('./pages/NotasPage'));
const TarefasPage      = lazy(() => import('./pages/TarefasPage'));
const EstudosPage      = lazy(() => import('./pages/EstudosPage'));

function App() {
  // Restaura cache do localStorage ao inicializar (offline-first)
  useEffect(() => {
    restaurarCache();

    // Persiste cache quando a aba perde foco ou o usuário fecha o browser
    const handleBlur = () => persistirCache();
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', persistirCache);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', persistirCache);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        HashRouter em vez de BrowserRouter:
        - BrowserRouter usa rotas reais (/planejamento) → precisa de servidor para resolver
        - HashRouter usa fragmento de URL (#/planejamento) → resolvido 100% no cliente
        - Resultado: funciona ao abrir dist/index.html diretamente, sem servidor
      */}
      <HashRouter>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen bg-bg-deep text-purple-text text-sm">
              Carregando…
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route index                element={<DashboardPage />} />
              <Route path="planejamento"  element={<PlanejamentoPage />} />
              <Route path="rotina-atual"  element={<RotinaAtualPage />} />
              <Route path="historico"     element={<HistoricoPage />} />
              <Route path="timer"         element={<TimerPage />} />
              <Route path="notas"         element={<NotasPage />} />
              <Route path="tarefas"       element={<TarefasPage />} />
              <Route path="estudos"       element={<EstudosPage />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>

      {/* DevTools só aparecem em desenvolvimento */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
