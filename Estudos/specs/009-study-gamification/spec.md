# Feature Specification: Study Gamification

**Feature Branch**: `009-study-gamification`
**Created**: 2026-04-30
**Status**: Draft
**Role**: Feature (Engajamento)
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**:
- [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos) — **obrigatório**
- [008-study-flashcard-web](../008-study-flashcard-web/spec.md) (flashcard_events.json + summary_feedback.json) — **obrigatório**

> **Posição no pipeline**: Spec 009 é downstream de spec 008. Não depende de 004/005 diretamente — consome os eventos já processados pela plataforma web de flashcards.

---

## Escopo

Sistema de gamificação que consome eventos de revisão de flashcards (`flashcard_events.json`) e feedbacks de resumos (`summary_feedback.json`) para conceder XP, calcular nível do personagem e desbloquear funcionalidades de jogabilidade. Cobre: personagem com XP e nível, tabela de marcos de desbloqueio, API de estado do personagem (consumida pela spec 008) e notificações de subida de nível.

## Rationale

A gamificação fecha o ciclo de engajamento: o usuário estuda (spec 008), ganha XP, sobe de nível e desbloqueia novas mecânicas de jogo. Isso transforma o estudo para concursos — tarefa percebida como árida — em progressão com recompensas visíveis. A spec 009 é isolada em bounded context próprio porque sua lógica (calcular pontos, gerenciar nível, verificar marcos) não deve contaminar a lógica de revisão da spec 008.

**Por que desacoplar via JSON**: Spec 008 grava eventos; spec 009 lê eventos. Nenhuma chamada direta entre elas. Isso segue o Princípio VI (Separação de Responsabilidades) e permite que ambas evoluam independentemente.

---

## Mecânicas de Gamificação

### Fontes de XP

| Ação | XP Base | Multiplicador de Relevância | Resultado |
|------|---------|----------------------------|-----------|
| Flashcard avaliado como "Errei" | 5 XP | Alta ×2 / Média ×1.5 / Baixa ×1 | 5–10 XP |
| Flashcard avaliado como "Difícil" | 10 XP | Alta ×2 / Média ×1.5 / Baixa ×1 | 10–20 XP |
| Flashcard avaliado como "Bom" | 15 XP | Alta ×2 / Média ×1.5 / Baixa ×1 | 15–30 XP |
| Flashcard avaliado como "Fácil" | 20 XP | Alta ×2 / Média ×1.5 / Baixa ×1 | 20–40 XP |
| Feedback de resumo "Correto" | 10 XP | — (fixo) | 10 XP |
| Feedback de resumo "Com erros" | 15 XP | — (fixo, incentiva identificar problemas) | 15 XP |
| Feedback de resumo "Observação" | 12 XP | — (fixo) | 12 XP |

> **Nota pedagógica**: "Errei" concede XP menor mas não zero — o erro consciente é parte do aprendizado e não deve ser penalizado com XP = 0 (isso desincentivaria o uso honesto do botão).

### Fórmula de Nível

```
nível = floor(xp_total / 100) + 1
xp_para_proximo_nivel = (nível × 100) - xp_total
```

Exemplo: 250 XP → nível 3 (floor(250/100) + 1), faltam 50 XP para o nível 4.

### Marcos de Desbloqueio

| Nível | Funcionalidade Desbloqueada | Descrição |
|-------|-----------------------------|-----------|
| 1 | Modo Revisão Básico | Disponível desde o início |
| 3 | Modo Quiz | Cards exibidos sem frente/verso — o usuário digita a resposta |
| 5 | Desafio Cronometrado | Sessão de revisão com contador regressivo por card |
| 8 | Modo Maratona | Sessão sem limite de cards — encerra apenas quando o usuário parar |
| 10 | Revisão por Relevância | Sessão dedicada apenas a cards de relevância alta (🔥) |
| 15 | Desafio de Banca | Cards agrupados por banca do edital (spec 003, opcional) |

---

## User Scenarios & Testing

### User Story 1 — Ganhar XP por Revisão de Flashcard (Priority: P1)

A cada flashcard avaliado na spec 008, o sistema calcula e acumula XP no personagem.

**Why this priority**: XP é o combustível de toda a gamificação — sem acúmulo de XP, nível e desbloqueios não funcionam.

**Independent Test**: Após gerar eventos em `/data/flashcard_events.json` (manualmente ou via spec 008), invocar o processador de eventos e verificar que `character_state.json` reflete o XP correto.

**Acceptance Scenarios**:

1. **Given** novo evento em `flashcard_events.json` com `avaliacao: "bom"` e `relevancia: "alta"`, **When** o processador de eventos é executado, **Then** o personagem recebe 30 XP (15 × 2).
2. **Given** XP acumulado cruza o limiar de um novo nível, **When** o estado é persistido, **Then** `character_state.json` atualiza `nivel`, `xp_total` e `xp_para_proximo_nivel`.
3. **Given** evento já processado (mesmo `timestamp` + `topico_id`), **When** o processador roda novamente, **Then** o evento é ignorado (idempotência — sem XP duplicado).

---

### User Story 2 — Ganhar XP por Feedback de Resumo (Priority: P2)

A cada feedback de resumo submetido na spec 008, o sistema concede XP fixo ao personagem.

**Why this priority**: Fechar o ciclo de feedback (resumo → melhora → XP) é o segundo pilar do engajamento.

**Independent Test**: Após gerar evento em `/data/summary_feedback.json`, verificar incremento de XP em `character_state.json`.

**Acceptance Scenarios**:

1. **Given** feedback `tipo_feedback: "com_erros"` em `summary_feedback.json`, **When** processado, **Then** personagem recebe 15 XP.
2. **Given** feedback `tipo_feedback: "correto"`, **When** processado, **Then** personagem recebe 10 XP.
3. **Given** feedback com observação (`tipo_feedback: "observacao"`), **When** processado, **Then** personagem recebe 12 XP.

---

### User Story 3 — Personagem com Nível e XP (Priority: P3)

O personagem tem nome, nível, XP acumulado e XP necessário para o próximo nível — visível no dashboard da spec 008.

**Why this priority**: O personagem é o elemento visual central da gamificação — sem ele, os pontos são abstratos demais.

**Independent Test**: Acessar `/api/character` (endpoint exposto para spec 008) e verificar JSON de estado do personagem.

**Acceptance Scenarios**:

1. **Given** `character_state.json` existe, **When** `GET /api/character` é chamado, **Then** retorna `{ "nome", "nivel", "xp_total", "xp_para_proximo_nivel", "conquistas" }`.
2. **Given** primeiro acesso (sem `character_state.json`), **When** endpoint é chamado, **Then** cria personagem padrão no nível 1 com 0 XP.
3. **Given** novo nível alcançado, **When** o estado é atualizado, **Then** uma notificação é gerada em `/data/gamification_notifications.json` com `{ "tipo": "nivel_novo", "nivel": N, "timestamp" }`.

---

### User Story 4 — Desbloquear Marcos de Jogabilidade (Priority: P4)

Ao atingir o nível de um marco, a funcionalidade correspondente é desbloqueada e comunicada ao usuário.

**Why this priority**: Os desbloqueios são o incentivo concreto para continuar estudando — sem eles, o nível é só um número.

**Independent Test**: Forçar `xp_total = 300` em `character_state.json` (nível 4) e verificar que marcos 1–3 aparecem como desbloqueados na resposta de `/api/character`.

**Acceptance Scenarios**:

1. **Given** personagem atinge nível 3, **When** estado é persistido, **Then** `character_state.json` marca `"modo_quiz": true` em `conquistas`.
2. **Given** conquista desbloqueada, **When** `/api/character` é chamado, **Then** a conquista aparece em `conquistas[]` com `{ "id", "nome", "desbloqueada_em" }`.
3. **Given** marco não atingido, **When** `/api/character` é chamado, **Then** funcionalidade não aparece nas conquistas (não deve exibir "bloqueado" no JSON — invisibilidade é preferível a frustração).

---

### Edge Cases

- O que acontece quando `flashcard_events.json` não existe? Sistema cria personagem no nível 1 com 0 XP e aguarda eventos.
- O que acontece quando o XP calculado resulta em vários subidas de nível simultaneamente (ex: +500 XP)? Sistema aplica todos os marcos intermediários e registra cada subida de nível individualmente nas notificações.
- O que acontece quando spec 008 não está rodando mas `character_state.json` é lido? Estado persiste intacto — spec 009 é um processador de eventos, não um servidor contínuo (pode ser rodado como script ou integrado ao servidor da 008).

---

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE ler `/data/flashcard_events.json` e `/data/summary_feedback.json` para calcular XP acumulado.
- **FR-002**: O sistema DEVE calcular XP por evento de revisão conforme tabela de mecânicas: base × multiplicador de relevância.
- **FR-003**: O sistema DEVE calcular XP por evento de feedback conforme tabela de mecânicas (valor fixo por tipo).
- **FR-004**: O sistema DEVE persistir estado do personagem em `/data/character_state.json` com campos: `nome`, `nivel`, `xp_total`, `xp_para_proximo_nivel`, `conquistas[]`, `eventos_processados[]` (IDs já processados — para idempotência).
- **FR-005**: O sistema DEVE calcular nível via fórmula `floor(xp_total / 100) + 1`.
- **FR-006**: O sistema DEVE verificar marcos de desbloqueio após cada atualização de XP e registrar conquistas novas em `character_state.json`.
- **FR-007**: O sistema DEVE gerar notificação em `/data/gamification_notifications.json` quando novo nível é alcançado.
- **FR-008**: O sistema DEVE expor endpoint `GET /api/character` (integrado ao servidor da spec 008 ou como servidor separado na porta 3001) retornando estado atual do personagem em JSON.
- **FR-009**: O sistema DEVE garantir idempotência: eventos já presentes em `eventos_processados[]` não geram XP novamente.
- **FR-010**: Toda comunicação com o usuário (notificações, mensagens) DEVE ser em PT-BR (Constitution I).

### Key Entities

- **Personagem**: Representa o avatar do usuário. Campos: `nome` (str), `nivel` (int), `xp_total` (int), `xp_para_proximo_nivel` (int), `conquistas` (list[Conquista]), `eventos_processados` (list[str] — chaves de idempotência).
- **Conquista**: Marco desbloqueado. Campos: `id` (str), `nome` (str), `descricao` (str), `nivel_requerido` (int), `desbloqueada_em` (ISO 8601 | null).
- **EventoXP**: Registro de XP concedido. Campos: `fonte` (flashcard|feedback), `topico_id` (str|null), `valor_xp` (int), `timestamp` (ISO 8601).
- **Notificação**: Comunicação ao usuário sobre mudança de estado. Campos: `tipo` (nivel_novo|conquista_desbloqueada), `nivel` (int|null), `conquista_id` (str|null), `timestamp`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos eventos de `flashcard_events.json` resultam em XP calculado e persistido, sem duplicatas (idempotência).
- **SC-002**: 100% dos marcos de desbloqueio são verificados após cada atualização de XP — nenhum nível passado sem verificação.
- **SC-003**: `character_state.json` é sempre consistente com o histórico de eventos (reprocessamento do zero deve produzir o mesmo estado).
- **SC-004**: Endpoint `GET /api/character` responde em < 100ms.

---

## Assumptions

- Spec 008 é pré-requisito e já gera os arquivos de eventos no formato especificado.
- O nome do personagem pode ser definido pelo usuário em primeira execução; padrão: "Candidato".
- Multi-personagem não é escopo v1 (um personagem por instância do sistema).
- A jogabilidade desbloqueada (Modo Quiz, Desafio Cronometrado etc.) é implementada na v2 da spec 008, usando as flags de `conquistas` do personagem como feature flags.
- Spec 009 pode ser implementada como módulo integrado ao servidor Express.js da spec 008 (mesma porta 3000) ou como serviço separado (porta 3001) — decisão a ser tomada no `plan.md`.
