# Plano de Implementação: Study Flashcard Web

**Branch**: `008-study-flashcard-web` | **Data**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Entrada**: Especificação da feature em `/specs/008-study-flashcard-web/spec.md`

## Resumo

Plataforma web de flashcards com repetição espaçada (algoritmo SM-2) para revisão dos tópicos gerados na spec 004. Backend Node.js + Express.js, frontend HTML+CSS+JS puro (v1), feedback de resumos e persistência de progresso via JSON. Os eventos gerados alimentam a gamificação (spec 009) via `flashcard_events.json` e `summary_feedback.json`.

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Repository**, **Service Layer**, **MVC simplificado** e **Event-Driven via arquivo**. Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix) abaixo.

## Contexto Técnico

**Linguagem/Versão**: Node.js 18+ (JavaScript ES2022)
**Dependências Principais**: `express` (única dependência npm — `npm install express`)
**Armazenamento**: JSON em `/data/` — leitura: `topicos.json`, `relevancia_topicos.json`, `flashcard_progress_<mat>.json`; escrita: `flashcard_progress_<mat>.json` (SM-2), `flashcard_events.json`, `summary_feedback.json`
**Testes**: Manual via browser + `curl` — cenários documentados em `quickstart.md`
**Plataforma-Alvo**: Windows, Node.js 18+, executado como servidor local
**Tipo de Projeto**: Web service (backend API + frontend estático, single porta 3000)
**Metas de Performance**: Cada transição de card (revelar/avaliar) em < 200ms; servidor inicia em < 5s
**Restrições**: Zero dependências além de `express`; frontend v1 sem bundler; JSON como única persistência
**Escala/Abrangência**: Single user, ~10–500 cards por sessão, múltiplas matérias

## Verificação da Constituição

*GATE: Deve ser aprovada antes da pesquisa da Fase 0. Reavaliada após o design da Fase 1.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | ✅ PASS | Todas mensagens ao usuário em PT-BR (spec FR-001 a FR-013); erros de API em PT-BR |
| II | Confirmação Antes de Ações | ✅ PASS | Nenhuma ação destrutiva nesta spec; feedback é adição, não sobrescrita |
| III | Pipeline Sequencial | ✅ PASS | Feature é output — depende de 002, 004, 005; progresso SM-2 persiste entre sessões |
| IV | Dados Estruturados | ✅ PASS | Progresso, eventos e feedback persistem em JSON em `/data/`; Constitution IV respeitada |
| V | RAG com Validação | ✅ PASS | Sem web search; lê apenas dados locais |
| VI | Separação de Responsabilidades | ✅ PASS | 5 camadas distintas: routes/, services/, repositories/, public/, server.js |
| VII | Observabilidade | ✅ PASS | Logs de startup e erros via console; eventos em `flashcard_events.json` são auditáveis |
| VIII | Evolução Compatível | ✅ PASS | API REST imutável entre v1 (HTML) e v2 (React); arquivos JSON versionados |
| IX | Desenvolvimento Orientado ao Aprendizado | ✅ PASS | Padrões nomeados neste plan; tasks com responsabilidade única |

**Resultado: GATE PASS** — sem violações constitucionais.

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.
> Aprenda o nome de cada padrão — você os encontrará em todo projeto JavaScript.

### Padrão 1 — Repository (Repositório)

**O que é**: Um objeto que sabe ler e escrever dados de um lugar específico e expõe uma interface limpa. O restante do código não sabe de onde os dados vêm.

**Por que usamos aqui**: A lógica de negócio (SM-2, XP) não deve precisar saber que os dados estão em arquivos JSON. `topicos_repository.js` lê `topicos.json` e entrega listas JavaScript. `progress_repository.js` lê e escreve o progresso SM-2. Se mudarmos para banco de dados, só o Repository muda.

**Arquivos**: `repositories/topicos_repository.js`, `repositories/progress_repository.js`

---

### Padrão 2 — Service Layer (Camada de Serviço)

**O que é**: O arquivo que contém as "regras de negócio" — o que o sistema faz, independente de onde os dados vêm ou como são exibidos.

**Por que usamos aqui**: "Próxima revisão = intervalo SM-2 × fator_facilidade" é uma regra de negócio — fica em `srs_service.js`. "XP = 15 × 2 para card bom de relevância alta" fica em `xp_service.js`. Esses arquivos não fazem HTTP nem leem arquivos; recebem dados e retornam dados.

**Arquivos**: `services/srs_service.js`, `services/xp_service.js`, `services/flashcard_service.js`

---

### Padrão 3 — MVC Simplificado (Model-View-Controller)

**O que é**: Separação em 3 camadas: Model (dados), View (HTML que o usuário vê), Controller (recebe requisição, chama serviços, devolve resposta).

**Por que usamos aqui**: As rotas Express.js são os Controllers — recebem o `req`, chamam o serviço certo, devolvem JSON. Os arquivos em `public/` são as Views. Os Repositories são o Model. Essa separação garante que trocar o View (de HTML puro para React) não exige mudar nada nos Controllers ou nos Models.

**Arquivos**: `routes/` (Controllers), `public/` (Views), `repositories/` (Models)

---

### Padrão 4 — Event-Driven via Arquivo

**O que é**: Em vez de chamar diretamente o sistema de gamificação, esta spec *emite eventos* (escreve em `flashcard_events.json`), e a spec 009 os *consome* quando quiser. Sem acoplamento direto.

**Por que usamos aqui**: Spec 008 e spec 009 são bounded contexts independentes. Se a spec 009 ainda não estiver implementada, a 008 funciona 100% — os eventos ficam acumulados e serão processados quando 009 for implementada. Esse é o Princípio VI (Separação) em ação.

**Implementado em**: `routes/cards.js` (POST /api/review → append em `flashcard_events.json`), `routes/feedback.js` (POST /api/feedback → append em `summary_feedback.json`)

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/008-study-flashcard-web/
├── plan.md              # Este arquivo
├── research.md          # SM-2, Express.js, migração React (Fase 0)
├── data-model.md        # CardProgresso, EventoRevisao, FeedbackResumo (Fase 1)
├── quickstart.md        # Como testar cada User Story (Fase 1)
├── contracts/
│   └── api_rest.md      # Endpoints REST + contratos de eventos JSON (Fase 1)
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Código-Fonte (skill reutilizável)

```text
.github/skills/study-flashcard-web/
├── server.js                          # Entry point — Express app, rotas, middleware  [NOVO]
├── package.json                       # Manifesto Node.js — única dep: express        [NOVO]
│
├── routes/
│   ├── cards.js      # GET /api/materias, GET /api/cards, POST /api/review            [NOVO]
│   ├── feedback.js   # POST /api/feedback                                             [NOVO]
│   ├── character.js  # GET /api/character (integra spec 009 ou retorna fallback)      [NOVO]
│   └── dashboard.js  # GET /api/dashboard                                             [NOVO]
│
├── services/
│   ├── srs_service.js        # SM-2: calcularProximaRevisao(card, q) → card           [NOVO]
│   ├── xp_service.js         # calcularXP(avaliacao, relevancia) → number             [NOVO]
│   └── flashcard_service.js  # montarCard(topico, progresso, relevancia) → Card       [NOVO]
│
├── repositories/
│   ├── topicos_repository.js  # lerTopicos(workspaceDir) → list                       [NOVO]
│   └── progress_repository.js # lerProgresso / salvarProgresso / appendEvento        [NOVO]
│
└── public/
    ├── index.html    # Seleção de matéria — fetch /api/materias                       [NOVO]
    ├── review.html   # Revisão de card — fetch /api/cards, POST /api/review           [NOVO]
    ├── dashboard.html # Dashboard — fetch /api/dashboard                              [NOVO]
    ├── style.css     # Estilos compartilhados                                         [NOVO]
    └── app.js        # JS frontend puro — lógica de UI (revelar, avaliar, feedback)  [NOVO]

data/                 # Runtime — criado pela spec 002
├── topicos.json                           # Input (spec 004 — obrigatório)
├── relevancia_topicos.json                # Input (spec 005 — opcional)
├── flashcard_progress_<mat>.json          # Progresso SM-2 por matéria (escrito pela 008)
├── flashcard_events.json                  # Eventos de revisão (lidos pela spec 009)
└── summary_feedback.json                  # Feedbacks de resumo (lidos pela spec 009)
```

**Decisão de Estrutura**: Aplicação web — backend separado do frontend estático. Backend em `.github/skills/study-flashcard-web/`, frontend em `public/` dentro da skill. API prefixada com `/api/` para compatibilidade com React na v2.

## Rastreamento de Complexidade

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra as fases e o padrão aplicado — para que você entenda a sequência lógica antes de ver as tasks.

### Fase 1 — Setup e Infraestrutura Base

**Padrão aplicado**: MVC Simplificado (estrutura)

Cria o projeto Node.js com Express, a estrutura de diretórios e o servidor mínimo rodando. Sem lógica de negócio — só o esqueleto.

- `package.json` com `express` como dependência
- `server.js` com `express.static('public')` e import das rotas
- Arquivos vazios (stubs) para todas as rotas e services

**Checkpoint**: `node server.js` → servidor responde em `http://localhost:3000` com página de placeholder.

---

### Fase 2 — Repository + Flashcard Service (Leitura de dados)

**Padrão aplicado**: Repository + Service Layer

Implementa a leitura de `topicos.json` e `relevancia_topicos.json` e a construção de Cards em memória. Sem rotas ainda — só as camadas de dados e serviço.

- `topicos_repository.js`: lê e valida `topicos.json`
- `flashcard_service.js`: monta Card (frente = L0, verso = L1+L2, truncamento)
- `progress_repository.js`: lê `flashcard_progress_<mat>.json` (cria se não existir)

**Checkpoint**: Repository + flashcard_service testáveis com `node -e "require('./repositories/topicos_repository').lerTopicos('../../../')"`.

---

### Fase 3 — SM-2 e XP Services

**Padrão aplicado**: Service Layer

Implementa a lógica pura de SM-2 e cálculo de XP. Sem IO, sem Express — funções puras testáveis.

- `srs_service.js`: `calcularProximaRevisao(card, q)` → card atualizado
- `xp_service.js`: `calcularXP(avaliacao, relevancia)` → número

**Checkpoint**: Chamar `calcularProximaRevisao({intervalo:1, fator_facilidade:2.5, repeticoes:1}, 4)` retorna `{intervalo:6, ...}`. Chamar `calcularXP("bom", "alta")` retorna `30`.

---

### Fase 4 — User Story 1 + 2: Sessão de Revisão (API + UI)

**Padrão aplicado**: MVC Simplificado + Event-Driven via Arquivo

Implementa o fluxo completo de revisão: selecionar matéria → ver cards pendentes → revelar → avaliar → registrar evento.

- `routes/cards.js`: GET `/api/materias`, GET `/api/cards`, POST `/api/review`
- `progress_repository.js`: `salvarProgresso()`, `appendEvento()`
- `public/index.html` + `public/review.html` + `public/app.js`: UI de seleção e revisão

**Checkpoint**: Fluxo completo end-to-end: selecionar matéria → revisar card → clicar "Bom" → verificar `flashcard_progress_*.json` atualizado e evento em `flashcard_events.json`.

---

### Fase 5 — User Story 3: Feedback de Resumo

**Padrão aplicado**: Event-Driven via Arquivo

Adiciona o modal/seção de feedback durante a revisão e persiste em `summary_feedback.json`.

- `routes/feedback.js`: POST `/api/feedback`
- `public/review.html` + `public/app.js`: botão "Ver resumo" e formulário de feedback

**Checkpoint**: Clicar "Com erros" durante revisão → `summary_feedback.json` tem novo registro com XP correto.

---

### Fase 6 — User Story 4: Dashboard + Character API

**Padrão aplicado**: Service Layer + Fallback defensivo

Implementa o dashboard de progresso e o endpoint de character (com fallback quando spec 009 não está disponível).

- `routes/dashboard.js`: GET `/api/dashboard`
- `routes/character.js`: GET `/api/character` (lê `character_state.json` ou retorna fallback)
- `public/dashboard.html`: visualização de progresso

**Checkpoint**: Acessar `/dashboard` → exibe cards revisados hoje, streak, XP. Acessar `/api/character` sem spec 009 → retorna fallback com `_aviso`.

---

### Fase Final — Polimento

- Revisar todas as mensagens ao usuário em PT-BR (Constitution I)
- Validar todos os cenários do `quickstart.md` (SC-001 a SC-005)
- Garantir que `package.json` tem script `"start": "node server.js"`
- Documentar no `quickstart.md` o caminho exato para v2 (React)

## Notas

- **Princípio VIII**: API REST é o contrato imutável entre v1 e v2 — nenhuma rota deve mudar ao migrar para React
- **Princípio IX**: `srs_service.js` e `xp_service.js` são funções puras — entrada/saída sem efeitos colaterais; se crescerem, dividir em funções menores
- **Princípio IV**: `flashcard_events.json` e `summary_feedback.json` são append-only — nunca sobrescrever; sempre ler + push + salvar
- O endpoint `/api/character` funciona mesmo sem a spec 009 — o fallback garante que o dashboard carrega sempre
