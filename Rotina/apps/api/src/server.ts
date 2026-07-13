// apps/api/src/server.ts

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';

// Routes
import { tarefaRoutes }    from './modules/tarefa/tarefa.routes';
import { acaoRoutes }      from './modules/acao/acao.routes';
import { blocoRoutes }     from './modules/bloco/bloco.routes';
import { rotinaRoutes }    from './modules/rotina/rotina.routes';
import { historicoRoutes } from './modules/historico/historico.routes';
import { habiticaRoutes }  from './modules/habitica/habitica.routes';
import { togglRoutes }     from './modules/toggl/toggl.routes';

// ── Bootstrap ────────────────────────────────────────────

const app = express();
const db  = new PrismaClient();
const PORT = process.env['PORT'] ?? 3333;

// ── Middlewares globais ───────────────────────────────────

app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }));
app.use(express.json());

// ── Health check ─────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas por módulo ─────────────────────────────────────

app.use('/api/tarefas',    tarefaRoutes(db));
app.use('/api/acoes',      acaoRoutes(db));
app.use('/api/blocos',     blocoRoutes(db));
app.use('/api/rotina',     rotinaRoutes(db));
app.use('/api/historico',  historicoRoutes(db));
app.use('/api/habitica',   habiticaRoutes());
app.use('/api/toggl',      togglRoutes());

// ── Tratamento global de erros (deve ser ÚLTIMO middleware) ──

app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});

export { app };
