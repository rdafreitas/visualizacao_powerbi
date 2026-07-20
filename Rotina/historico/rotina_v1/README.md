# Rotina — Organização Pessoal

Aplicação fullstack offline-first para gestão de rotina, blocos de atividades, tarefas e histórico pessoal, com integração ao Google Sheets, Habitica e Toggl.

---

## Stack

| Camada       | Tecnologia                                    |
|--------------|-----------------------------------------------|
| Backend      | Node.js · Express · TypeScript                |
| ORM          | Prisma (SQLite local / PostgreSQL em produção)|
| Frontend     | React 18 · TypeScript · Vite                  |
| State        | TanStack Query (React Query v5)               |
| Estilização  | Tailwind CSS v3                               |
| Monorepo     | pnpm Workspaces                               |

---

## Estrutura do Monorepo

```
rotina-app/
├── apps/
│   ├── api/                    # Backend Express + TypeScript
│   │   └── src/
│   │       ├── modules/        # Domínios da aplicação
│   │       │   ├── bloco/      # Blocos de atividades
│   │       │   ├── acao/       # Ações do bloco
│   │       │   ├── tarefa/     # Tarefas por ação
│   │       │   ├── rotina/     # Rotina Atual (gerada)
│   │       │   ├── historico/  # Histórico de blocos
│   │       │   ├── habitica/   # Integração Habitica
│   │       │   └── toggl/      # Integração Toggl
│   │       ├── shared/
│   │       │   ├── middlewares/
│   │       │   ├── helpers/    # Padronização HTTP
│   │       │   └── errors/     # Classes de erro
│   │       ├── config/         # Env, Prisma, CORS
│   │       └── server.ts
│   │
│   └── web/                    # Frontend React + Vite
│       └── src/
│           ├── components/     # Componentes por feature
│           ├── hooks/          # useQuery / useMutation por domínio
│           ├── services/       # Camada HTTP (fetch)
│           ├── stores/         # Estado local (Zustand)
│           ├── types/          # Interfaces compartilhadas
│           └── utils/
│
└── packages/
    ├── shared-types/           # DTOs compartilhados API↔Frontend
    └── ui-tokens/              # Design tokens (cores, fontes)
```

---

## Setup rápido

```bash
# Pré-requisitos: Node 20+, pnpm 9+
npm i -g pnpm

# Instalar dependências de todo o monorepo
pnpm install

# Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Gerar banco de dados local (SQLite)
pnpm --filter api db:migrate

# Rodar seed de dados de exemplo
pnpm --filter api db:seed

# Iniciar os dois apps em paralelo
pnpm dev
```

Acesse em: **http://localhost:5173**
API em: **http://localhost:3333**

---

## Scripts disponíveis

```bash
pnpm dev              # Sobe API + Web em paralelo
pnpm build            # Build de produção dos dois apps
pnpm --filter api dev          # Só API
pnpm --filter web dev          # Só Frontend
pnpm --filter api db:studio    # Prisma Studio (GUI do banco)
pnpm --filter api db:migrate   # Aplica migrations
pnpm --filter api db:seed      # Seed de dados iniciais
pnpm lint             # ESLint em todo o monorepo
pnpm typecheck        # tsc --noEmit em todo o monorepo
```

---

## Decisões de Arquitetura

### Backend — Repository Pattern + SOLID

Cada módulo segue a estrutura:
```
módulo/
├── module.types.ts      # Interfaces (Request/Response DTOs)
├── module.repository.ts # Acesso ao Prisma (único ponto de dados)
├── module.service.ts    # Regras de negócio (não conhece HTTP)
├── module.controller.ts # Recebe req/res, chama service, responde
└── module.routes.ts     # Definição das rotas Express
```

### Frontend — TanStack Query + Offline-first

- `useQuery` para leituras com cache automático
- `useMutation` + `onMutate` para **optimistic updates** (UI atualiza antes da resposta)
- `localStorage` como camada de persistência offline via `QueryClient` com `persistQueryClient`
- `useMemo` / `useCallback` para evitar re-renders desnecessários

### Tipagem Compartilhada

O package `shared-types` exporta as interfaces de domínio usadas tanto pela API (tipagem dos controllers) quanto pelo frontend (tipagem das queries). Garante contratos consistentes sem duplicação.
