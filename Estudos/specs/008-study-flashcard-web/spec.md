# Feature Specification: Study Flashcard Web

**Feature Branch**: `008-study-flashcard-web`
**Created**: 2026-04-30
**Status**: Draft
**Role**: Feature (Output + Feedback)
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**:
- [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos, confirmação) — **obrigatório**
- [004-study-summary-generation](../004-study-summary-generation/spec.md) (topicos.json) — **obrigatório**
- [005-study-relevance-engine](../005-study-relevance-engine/spec.md) (relevancia_topicos.json) — **obrigatório**

> **Coexistência com spec 007**: Esta feature não substitui a integração AnkiConnect. Ambas consomem o mesmo `topicos.json` e são canais de revisão independentes. O usuário pode usar os dois.

---

## Escopo

Plataforma web de flashcards com repetição espaçada (algoritmo SM-2) para revisão dos tópicos gerados na spec 004. Cobre: servidor Node.js + Express.js, interface HTML+CSS+JS (v1), sessão de revisão com avaliação de dificuldade, feedback de resumos e persistência de progresso. Os eventos gerados (revisão e feedback) servem como input para a gamificação (spec 009).

## Rationale

Canal de revisão web próprio — permite estudar diretamente no browser sem depender do Anki Desktop estar instalado. A interface web também introduz o mecanismo de feedback de resumos (marcar erros/acertos em resumos publicados), que é necessário para a gamificação. Stack Node.js + Express.js foi escolhida por ser simples, sem build tools obrigatórios na v1, e por ser a base natural para evolução ao React na v2.

---

## Stack Técnico

| Camada | v1 | v2 (evolução planejada) |
|--------|-----|------------------------|
| Backend | Node.js + Express.js | Mesmo |
| Frontend | HTML + CSS + JavaScript puro | React (sem substituir backend) |
| Persistência | JSON em `/data/` | Mesmo (Constitution IV) |
| Algoritmo SRS | SM-2 simplificado | FSRS (se SM-2 insuficiente) |
| Porta | 3000 | Mesma |

**Por que SM-2**: É o algoritmo original do Anki, bem documentado, sem dependências externas, implementável em ~50 linhas JavaScript. Aprenda o nome: "SM-2 = SuperMemo 2, algoritmo de repetição espaçada que calcula o intervalo de próxima revisão com base na dificuldade avaliada".

---

## User Scenarios & Testing

### User Story 1 — Iniciar Sessão de Revisão (Priority: P1)

O usuário seleciona uma matéria e inicia uma sessão com os flashcards pendentes (agendados pelo SM-2 para revisão naquele dia).

**Why this priority**: Sem seleção de sessão, nenhuma revisão pode ocorrer.

**Independent Test**: Com `topicos.json` presente e servidor rodando na porta 3000, acessar `http://localhost:3000`, selecionar matéria e verificar que cards pendentes são exibidos.

**Acceptance Scenarios**:

1. **Given** servidor rodando e `topicos.json` existente, **When** o usuário acessa `http://localhost:3000`, **Then** o sistema exibe lista de matérias disponíveis com contagem de cards pendentes para revisão hoje.
2. **Given** matéria selecionada, **When** a sessão é iniciada, **Then** o sistema exibe apenas os cards cujo `proxima_revisao` é ≤ data atual (SM-2), em ordem de prioridade (relevância alta primeiro).
3. **Given** todos os cards da sessão revisados, **When** a última revisão é concluída, **Then** o sistema exibe resumo da sessão: total revisado, acertos, erros e XP ganho.

---

### User Story 2 — Revisar Flashcard (Priority: P2)

O usuário vê a frente do card, decide revelar o verso e avalia sua própria dificuldade com 4 botões.

**Why this priority**: Core value desta spec — a revisão em si com avaliação de dificuldade alimenta o SM-2 e os eventos para gamificação.

**Independent Test**: Com card exibido, clicar em "Revelar" e nos 4 botões de avaliação; verificar que o progresso SM-2 é atualizado em `flashcard_progress_<materia>.json`.

**Acceptance Scenarios**:

1. **Given** sessão iniciada, **When** um card é exibido, **Then** apenas a frente (L0) é visível; o verso está oculto.
2. **Given** frente visível, **When** o usuário clica em "Revelar", **Then** o verso (L1+L2) é exibido junto com os 4 botões de avaliação: **Errei** / **Difícil** / **Bom** / **Fácil**.
3. **Given** verso revelado, **When** o usuário clica em um botão de avaliação, **Then** o sistema calcula novo intervalo SM-2, persiste em `flashcard_progress_<materia>.json` e avança para o próximo card.
4. **Given** avaliação registrada, **When** o evento é gerado, **Then** o sistema salva em `/data/flashcard_events.json`: `{ "topico_id", "materia", "avaliacao", "xp_concedido", "timestamp" }`.

---

### User Story 3 — Feedback de Resumo (Priority: P3)

Ao revisar um card, o usuário pode acessar o resumo vinculado e marcar se o conteúdo está correto ou contém erros.

**Why this priority**: O feedback de resumo fecha o ciclo de melhoria contínua (resumos corrigidos estruturam futuros resumos) e gera eventos para a gamificação.

**Independent Test**: Clicar em "Ver resumo" durante revisão; marcar feedback; verificar que `summary_feedback.json` é atualizado.

**Acceptance Scenarios**:

1. **Given** verso do card exibido, **When** o usuário clica em "Ver resumo", **Then** o sistema exibe o conteúdo do resumo (Markdown renderizado ou link para Google Doc).
2. **Given** resumo exibido, **When** o usuário seleciona feedback, **Then** as opções são: **Correto** / **Com erros** / **Adicionar observação** (texto livre).
3. **Given** feedback selecionado, **When** o usuário confirma, **Then** o sistema persiste em `/data/summary_feedback.json`: `{ "summary_id", "materia", "topico_id", "tipo_feedback", "observacao", "timestamp" }`.
4. **Given** feedback registrado, **When** o resumo é reprocessado no futuro (spec 004), **Then** as observações devem estar acessíveis como contexto de melhoria.

---

### User Story 4 — Dashboard de Progresso (Priority: P4)

O usuário visualiza seu progresso de estudos: cards revisados hoje, streak de dias consecutivos, XP total e próximas revisões agendadas.

**Why this priority**: Visibilidade do progresso é pré-condição para que a gamificação (spec 009) faça sentido ao usuário.

**Independent Test**: Após revisar ao menos um card, acessar `/dashboard` e verificar que os dados refletem as revisões realizadas.

**Acceptance Scenarios**:

1. **Given** usuário acessa `/dashboard`, **When** a página é carregada, **Then** exibe: cards revisados hoje, streak atual (dias consecutivos com revisão), XP total e nível do personagem (via spec 009).
2. **Given** dashboard carregado, **When** existem cards agendados para os próximos 7 dias, **Then** o sistema exibe previsão de revisões por dia (gráfico ou tabela simples).

---

### Edge Cases

- O que acontece quando `topicos.json` não existe? Servidor inicia mas exibe mensagem "Nenhum resumo processado ainda — execute o pipeline (spec 004) para gerar tópicos."
- O que acontece quando `relevancia_topicos.json` não existe? Sistema exibe cards sem marcação de relevância e prioriza por ordem de criação.
- O que acontece quando o usuário tenta revisar um card sem revelar o verso (clica direto no botão de avaliação)? O sistema exige que "Revelar" seja clicado antes de habilitar os botões de avaliação.
- O que acontece quando todos os cards estão em dia (sem revisões pendentes)? Sistema exibe "Nenhum card pendente para hoje" e mostra data do próximo card agendado.

---

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE iniciar um servidor Node.js + Express.js na porta 3000 com comando `node server.js` a partir de `.github/skills/study-flashcard-web/`.
- **FR-002**: O sistema DEVE carregar flashcards a partir de `/data/topicos.json` e, quando disponível, `/data/relevancia_topicos.json`.
- **FR-003**: O sistema DEVE implementar o algoritmo SM-2 para calcular o intervalo de próxima revisão de cada card após avaliação.
- **FR-004**: O sistema DEVE exibir a frente do card e ocultar o verso até ação explícita do usuário ("Revelar").
- **FR-005**: O sistema DEVE oferecer 4 botões de avaliação após revelar o verso: **Errei** (intervalo = 1 dia), **Difícil** (intervalo = intervalo × 1.2), **Bom** (intervalo SM-2 padrão), **Fácil** (intervalo × 1.3).
- **FR-006**: O sistema DEVE persistir o progresso SRS de cada card em `/data/flashcard_progress_<materia>.json` após cada avaliação.
- **FR-007**: O sistema DEVE registrar cada revisão em `/data/flashcard_events.json` com os campos: `topico_id`, `materia`, `avaliacao`, `xp_concedido`, `timestamp`.
- **FR-008**: O sistema DEVE calcular XP concedido por avaliação: Errei = 5 XP, Difícil = 10 XP, Bom = 15 XP, Fácil = 20 XP; multiplicado por fator de relevância (alta = ×2, média = ×1.5, baixa = ×1).
- **FR-009**: O sistema DEVE exibir link ou conteúdo do resumo vinculado ao card durante a revisão.
- **FR-010**: O sistema DEVE permitir que o usuário registre feedback do resumo (Correto / Com erros / Observação) persistido em `/data/summary_feedback.json`.
- **FR-011**: O sistema DEVE exibir dashboard em `/dashboard` com cards revisados hoje, streak, XP total e próximas revisões.
- **FR-012**: O frontend v1 DEVE ser implementado em HTML + CSS + JavaScript puro, sem transpiladores ou bundlers, para máxima simplicidade.
- **FR-013**: A estrutura de rotas e componentes do backend DEVE ser organizada para facilitar a migração do frontend para React na v2 (separação clara de API REST vs. renderização de páginas).

### Key Entities

- **CardProgresso**: Estado SM-2 de um card. Atributos: `topico_id`, `materia`, `intervalo_dias`, `fator_facilidade`, `repeticoes`, `proxima_revisao` (ISO 8601), `ultima_avaliacao`.
- **EventoRevisao**: Registro de cada revisão para gamificação. Atributos: `topico_id`, `materia`, `avaliacao` (errei|dificil|bom|facil), `xp_concedido`, `timestamp`.
- **FeedbackResumo**: Feedback do usuário sobre o conteúdo de um resumo. Atributos: `summary_id`, `materia`, `topico_id`, `tipo_feedback` (correto|com_erros|observacao), `observacao` (str|null), `timestamp`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% das avaliações de cards persistem `CardProgresso` atualizado em `/data/flashcard_progress_<materia>.json`.
- **SC-002**: 100% das avaliações geram evento em `/data/flashcard_events.json` (rastreabilidade para spec 009).
- **SC-003**: 100% dos feedbacks de resumo persistem em `/data/summary_feedback.json`.
- **SC-004**: Servidor inicia em < 5s; cada transição de card (revelar/avaliar) responde em < 200ms.
- **SC-005**: Dashboard reflete corretamente os dados de `flashcard_events.json` e `flashcard_progress_<materia>.json`.

---

## Assumptions

- Node.js 18+ disponível no ambiente Windows.
- Sem dependências de `npm install` na v1 além do Express.js (`npm install express`).
- `topicos.json` segue o contrato definido em spec 004.
- O frontend v1 é monopage simples — não há autenticação nem multi-usuário (escopo v1).
- A migração para React (v2) é planejada mas fora do escopo desta spec; a estrutura do backend deve facilitar, não exigir.
- XP calculado aqui é consumido pela spec 009 via leitura de `flashcard_events.json` — nenhuma chamada direta entre as duas specs (desacoplamento via arquivo JSON).
