# PaVoar Academia Circense — Arquitetura Next.js v2
## Documento de Estrutura e Conceito — Revisão com Roles e Pasta Pages

---

## 1. Visão Geral da Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.1 |
| UI | React | 19 |
| Tipagem | TypeScript | 5 (strict) |
| Estilos | Tailwind CSS | v4 |
| Banco de dados | Supabase (PostgreSQL) | latest |
| Autenticação | Supabase Auth | latest |
| App distribuível | PWA (next-pwa) | latest |

---

## 2. Modelo de Acesso — 4 Roles

| Role | Acesso | Rota | Restrições |
|---|---|---|---|
| `aluno` | Modo Aluno | `/pages/aluno/*` | Vê só seus próprios dados |
| `professor` | Modo Professor | `/pages/professor/*` | Vê suas aulas e alunos |
| `proprietario` | Modo Administrador completo | `/pages/admin/*` | Acesso total |
| `funcionario` | Modo Administrador limitado | `/pages/admin/*` | Sem Financeiro, sem Perfil/config |

---

## 3. Estrutura de Pastas

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                     # → /pages/login
│   └── pages/
│       ├── login/page.tsx
│       ├── admin/
│       │   ├── layout.tsx
│       │   ├── page.tsx             # → /pages/admin/home
│       │   ├── home/page.tsx
│       │   ├── alunos/page.tsx
│       │   ├── agenda/page.tsx
│       │   ├── professores/page.tsx
│       │   ├── financeiro/page.tsx  # proprietario only
│       │   └── perfil/page.tsx      # proprietario only
│       ├── professor/               # futuro
│       └── aluno/                   # futuro
│
├── components/
│   ├── ui/          # Button, Card, Badge, Modal, Toast, Input, Table, Tabs, Toggle, Chip
│   ├── layout/      # Topbar, Sidebar, PageHeader
│   ├── login/       # LoginLeft, LoginForm
│   └── admin/       # MetricCard, ActivityFeed, AlunosTable, AgendaDayPicker...
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   ├── permissions.ts
│   ├── constants.ts
│   └── utils.ts
│
├── hooks/
│   ├── useToast.ts
│   ├── useModal.ts
│   └── useCheckin.ts
│
└── types/
    ├── database.ts
    └── app.ts

Documents/
└── pavoar-arquitetura-v2.md

public/
├── manifest.json
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── sw.js
```

---

## 4. Sistema de Permissões

```typescript
// lib/permissions.ts
export type Role = 'proprietario' | 'funcionario' | 'professor' | 'aluno'

export const PERMISSIONS = {
  proprietario: ['admin:home','admin:alunos','admin:agenda','admin:professores','admin:financeiro','admin:perfil'],
  funcionario:  ['admin:home','admin:alunos','admin:agenda','admin:professores'],
  professor:    [],
  aluno:        [],
}

export const ROLE_HOME = {
  proprietario: '/pages/admin/home',
  funcionario:  '/pages/admin/home',
  professor:    '/pages/professor/home',
  aluno:        '/pages/aluno/home',
}
```

---

## 5. Fluxo de Autenticação

```
1. Usuário acessa /pages/login
2. Digita e-mail + senha
3. Supabase Auth valida
4. Server Action busca profiles.role
5. Redireciona para ROLE_HOME[role]
6. Middleware valida sessão + permissão em cada request
7. Logout → signOut() → /pages/login
```

---

## 6. Dependências

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install next-pwa
npm install lucide-react
```

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

---

## 7. Mudanças em relação à v1

| Item | v1 | v2 |
|---|---|---|
| Roles | admin, professor, aluno | proprietario, funcionario, professor, aluno |
| Login | Seletor visual de perfil | Simples (e-mail + senha) |
| Localização das páginas | src/app/login/, src/app/admin/ | src/app/pages/login/, src/app/pages/admin/ |
| Permissões | Hardcoded no middleware | Centralizadas em lib/permissions.ts |
