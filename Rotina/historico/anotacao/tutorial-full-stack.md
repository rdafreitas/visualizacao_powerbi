# Tutorial: Reconstruindo um Projeto Full Stack do Zero

> Roteiro de aprendizado baseado na arquitetura do projeto `rotina-app` (monorepo pnpm + Express + Prisma + React + Vite + Tailwind). O objetivo é entender o **porquê** de cada decisão, não apenas o **o quê** fazer.

---

## Fase 0 — Antes de escrever uma linha de código

### 1. Modelar o domínio no papel

O erro mais comum é abrir o editor antes de entender os dados. Pergunte-se:
- Quais são as **entidades** do sistema? (`Acao`, `Bloco`, `Tarefa`...)
- Quais são as **relações** entre elas? (1:N, N:N, auto-referencial?)
- Quais campos são obrigatórios vs opcionais?

> **Prática a aprender:** Esboce um diagrama ER (Entity-Relationship) antes de criar o Prisma schema. Pode ser no papel mesmo. Isso evita migrations desnecessárias depois.

### 2. Definir os contratos de API

Liste os endpoints que você vai precisar *antes* de implementar. Exemplo:
```
GET    /api/tarefas
POST   /api/tarefas
PATCH  /api/tarefas/:id
DELETE /api/tarefas/:id
```

> **Prática a aprender:** Isso se chama **API-first design**. Definir o contrato antes de codificar permite que front-end e back-end sejam desenvolvidos em paralelo sem bloquear um ao outro.

---

## Fase 1 — Estrutura do Projeto (Monorepo)

### 3. Instalar o pnpm e inicializar o workspace

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Criar a pasta raiz
mkdir meu-projeto && cd meu-projeto
git init
pnpm init
```

Criar o `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Criar a estrutura de pastas:
```bash
mkdir -p apps/api apps/web packages/shared-types
```

> **Por que pnpm?** Mais rápido que npm/yarn, tem suporte nativo a workspaces, e usa hard links no disco (economiza espaço). `workspace:*` é a sintaxe que permite importar pacotes locais sem publicar no npm.

### 4. Configurar o TypeScript base

Criar `tsconfig.base.json` na raiz com `strict: true`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

> **Prática crítica:** Sempre ative `"strict": true` desde o início. Ativar depois é doloroso — você terá centenas de erros acumulados. `noUncheckedIndexedAccess` evita o clássico bug de `array[0]` ser `undefined` silenciosamente.

### 5. Configurar o `.gitignore` antes de qualquer commit

```
node_modules/
dist/
.env
*.db
```

> **Regra de ouro:** `.env` nunca entra no Git. Sempre crie um `.env.example` com as variáveis necessárias mas sem valores reais.

---

## Fase 2 — O Contrato Compartilhado (packages/shared-types)

### 6. Criar o pacote de tipos compartilhados PRIMEIRO

Este é o passo mais contraintuitivo para iniciantes: **você cria os tipos antes de criar a API ou o front-end.**

```typescript
// packages/shared-types/src/index.ts
export interface Tarefa {
  id: string
  titulo: string
  prioridade: number
  concluida: boolean
  acaoId: string
  criadaEm: string
}

export interface CreateTarefaDTO {
  titulo: string
  prioridade: number
  acaoId: string
}
```

> **Por que isso importa?** Quando a API e o web importam da mesma fonte, uma mudança de tipo gera erro de compilação nos dois lados simultaneamente. É uma rede de segurança automática. Sem isso, você descobre incompatibilidades em runtime, não em build time.

**Diferença crucial entre tipos:**
```typescript
// Tipo de "saída" (o que a API retorna para o cliente)
export interface Tarefa { ... }

// Tipo de "entrada" (o que o cliente manda para a API)
export interface CreateTarefaDTO { ... }
export interface UpdateTarefaDTO { ... }
```
Nunca use o mesmo tipo para entrada e saída — os campos raramente são idênticos.

---

## Fase 3 — O Back-end (apps/api)

### 7. Configurar o Express com TypeScript

```bash
cd apps/api
pnpm init
pnpm add express cors dotenv express-async-errors
pnpm add -D typescript tsx @types/express @types/cors
```

Criar `src/server.ts`:
```typescript
import 'express-async-errors'  // IMPORTANTE: importar antes de tudo
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// rotas aqui

app.listen(3333, () => console.log('API rodando na porta 3333'))
```

> **Por que `express-async-errors`?** Express 4 não captura erros de `async/await` automaticamente. Sem esse pacote, um `throw` dentro de um handler assíncrono derruba o servidor silenciosamente.

### 8. Modelar o banco com Prisma

```bash
pnpm add @prisma/client
pnpm add -D prisma
pnpm prisma init
```

> **Prática a aprender — ordem das migrations:**
> 1. Modele no `schema.prisma`
> 2. Rode `pnpm prisma migrate dev --name nome_descritivo`
> 3. Rode `pnpm prisma generate` (gera o cliente tipado)
>
> Nunca edite o banco diretamente — sempre via migration. Isso cria um histórico versionado do schema, como um `git log` para o banco de dados.

### 9. Organizar por módulos (padrão que escala)

A estrutura de `tarefa/` no projeto demonstra o padrão correto:

```
src/modules/tarefa/
├── tarefa.routes.ts      ← "Onde" (URLs e métodos HTTP)
├── tarefa.controller.ts  ← "O quê" (recebe req, valida, chama service)
├── tarefa.service.ts     ← "Como" (lógica de negócio pura)
├── tarefa.repository.ts  ← "De onde" (acesso ao banco)
└── tarefa.types.ts       ← Tipos locais do módulo
```

**Por que cada camada existe:**

| Camada | Responsabilidade | O que NÃO deve fazer |
|---|---|---|
| `routes` | Mapear URL → controller | Nenhuma lógica |
| `controller` | Traduzir HTTP ↔ service | Não acessa banco diretamente |
| `service` | Lógica de negócio | Não conhece `req`/`res` |
| `repository` | Falar com o banco | Nenhuma regra de negócio |

> **Por que separar service de repository?** Se um dia você trocar SQLite por PostgreSQL, ou Prisma por outra ORM, só o `repository` muda. O `service` nem sabe que isso aconteceu.

### 10. Validação com Zod na entrada

```typescript
import { z } from 'zod'

const CreateTarefaSchema = z.object({
  titulo: z.string().min(1).max(200),
  prioridade: z.number().int().positive(),
  acaoId: z.string().uuid()
})

// No controller:
const body = CreateTarefaSchema.parse(req.body)
// Se inválido, lança erro automaticamente com mensagem clara
```

> **Prática crítica:** Nunca confie nos dados que chegam do cliente. Valide tudo na entrada da API. Zod gera tanto a validação em runtime quanto os tipos TypeScript — uma fonte de verdade só.

### 11. Middleware de erro centralizado

```typescript
// shared/middlewares/errorHandler.ts
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }
  console.error(err)
  return res.status(500).json({ message: 'Erro interno do servidor' })
})
```

> **Prática a aprender:** Todo tratamento de erro deve passar por um único ponto. Isso evita `try/catch` espalhados por toda a API e garante respostas de erro consistentes para o cliente.

---

## Fase 4 — O Front-end (apps/web)

### 12. Criar o projeto com Vite

```bash
cd apps/web
pnpm create vite . --template react-ts
pnpm add tailwindcss @tailwindcss/vite
pnpm add @tanstack/react-query react-router-dom
```

### 13. Organizar as páginas separadas dos componentes

```
src/
├── pages/          ← Uma por rota. Orquestram dados e layout.
├── components/     ← Reutilizáveis, sem lógica de negócio.
├── hooks/          ← Lógica de dados encapsulada (useTarefas, useAcoes)
└── services/       ← Funções puras de chamada HTTP
```

> **Regra para não se perder:** Um componente em `pages/` pode ter lógica de fetch e estado. Um componente em `components/` deve ser **"burro"** — recebe props e renderiza, sem conhecer a API.

### 14. Encapsular chamadas HTTP em services

```typescript
// services/api.service.ts
const BASE_URL = import.meta.env.VITE_API_URL

export async function getTarefas(): Promise<Tarefa[]> {
  const res = await fetch(`${BASE_URL}/api/tarefas`)
  if (!res.ok) throw new Error('Falha ao buscar tarefas')
  return res.json()
}
```

> **Por que não chamar `fetch` direto nos componentes?** Se a URL muda, ou você precisa adicionar um header de autenticação, você muda em um lugar só. E os componentes ficam testáveis — você pode mockar o service sem mockar `fetch`.

### 15. Gerenciar estado do servidor com TanStack Query

```typescript
// hooks/useTarefas.ts
export function useTarefas() {
  return useQuery({
    queryKey: ['tarefas'],
    queryFn: getTarefas,
    staleTime: 1000 * 60  // cache de 1 minuto
  })
}
```

> **Conceito fundamental:** Existe **estado do servidor** (dados que vivem na API) e **estado do cliente** (UI local como "modal aberto?"). TanStack Query cuida do primeiro — cache, refetch, loading/error states. Zustand/useState cuida do segundo. Misturar os dois no mesmo estado é a fonte da maioria dos bugs de sincronização.

---

## Fase 5 — Pontos de Atenção Transversais

### Variáveis de ambiente por contexto

```
apps/api/.env     → DATABASE_URL, HABITICA_API_KEY, TOGGL_TOKEN
apps/web/.env     → VITE_API_URL=http://localhost:3333
```

> **Regra do Vite:** Só variáveis prefixadas com `VITE_` ficam disponíveis no browser. As demais são ignoradas por segurança — o browser não deve conhecer chaves de API do servidor.

### Scripts unificados no `package.json` raiz

```json
"scripts": {
  "dev": "pnpm --parallel -r dev",
  "build": "pnpm -r build"
}
```

`-r` = recursivo (roda em todos os workspaces), `--parallel` = roda simultaneamente. Com um só `pnpm dev` na raiz, API e Web sobem juntos.

### O que aprender em cada tecnologia

| Tecnologia | Conceito essencial a dominar |
|---|---|
| **TypeScript** | `strict: true`, tipos de utilitários (`Partial<T>`, `Pick<T>`, `Omit<T>`), nunca use `any` |
| **Prisma** | Migrations versionadas, relações N:N com tabela join explícita, `select` para não vazar campos |
| **Express** | Middlewares como pipeline, `async/await` com tratamento de erro centralizado |
| **React** | Ciclo de vida de componentes, quando usar `useEffect` vs `useQuery`, composição sobre herança |
| **TanStack Query** | `queryKey` como cache key, `invalidateQueries` após mutações, não duplicar estado |
| **Tailwind** | Design tokens no `tailwind.config.ts`, não usar valores arbitrários (`text-[#fff]`) sem necessidade |
| **Vite** | `import.meta.env`, aliases de path (`@/components`), diferença entre `dev` e `build` |

---

## Ordem de execução resumida

```
1. Modelar domínio no papel (ER diagram)
2. Definir contratos de API (endpoints + payloads)
3. Inicializar monorepo (pnpm workspace)
4. Criar packages/shared-types com interfaces
5. Criar apps/api → schema Prisma → server → módulos
6. Criar apps/web → Vite → páginas → hooks → services
7. Integrar: web consumindo API, tipos compartilhados validando tudo
8. Camada de agente (Claude skills, MCP) — só depois que o core funciona
```

A sequência mais importante é **4 antes de 5 e 6**: os tipos compartilhados são o alicerce. Tudo o mais se apoia neles.
