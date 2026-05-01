# Tarefas: Study Gamification

**Entrada**: Documentos de design em `/specs/009-study-gamification/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/gamification_module.md, research.md, quickstart.md
**Dependências obrigatórias**: 002-study-foundation, 008-study-flashcard-web (`flashcard_events.json`, `summary_feedback.json`)

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História?] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura do Módulo)

**Objetivo**: Criar a estrutura de arquivos do módulo antes de qualquer implementação. Spec 009 é um módulo Node.js sem servidor próprio — não requer `npm install` adicional.

- [ ] T001 Criar diretório `.github/skills/study-gamification/` com subdiretórios `services/` e `repositories/`
- [ ] T002 Criar `.github/skills/study-gamification/gamification_service.js` vazio — arquivo principal exportado pela spec 009; será preenchido nas fases seguintes
- [ ] T003 Criar `.github/skills/study-gamification/process_events.js` vazio — script standalone para debug; será preenchido na Fase Final

**Checkpoint**: Estrutura criada. Diretório e arquivos existem. Nenhum `require` falha ao ser chamado.

---

## Fase 2: Fundação — Character Repository (Pré-requisito Bloqueante)

**Objetivo**: Criar `character_repository.js` que isola toda leitura/escrita de JSON. Sem este módulo, nenhuma lógica de gamificação pode ser testada.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem o Repository — ele é o único ponto de acesso aos dados do personagem e aos eventos.

- [ ] T004 [P] Implementar `lerPersonagem(workspaceDir)` em `.github/skills/study-gamification/repositories/character_repository.js` — lê `character_state.json`; se não existir, retorna personagem padrão `{ nome: "Candidato", nivel: 1, xp_total: 0, xp_para_proximo_nivel: 100, conquistas: [], eventos_processados: [] }` (Padrão Repository)
- [ ] T005 [P] Implementar `salvarPersonagem(workspaceDir, personagem)` em `.github/skills/study-gamification/repositories/character_repository.js` — escreve `character_state.json` com campos `meta.version: "1.0"` e `meta.updated_at` em ISO 8601 (Constitution IV — versão obrigatória)
- [ ] T006 [P] Implementar `lerEventos(workspaceDir)` em `.github/skills/study-gamification/repositories/character_repository.js` — lê `/data/flashcard_events.json` e `/data/summary_feedback.json` com leitura defensiva (retorna `{ eventos: [], feedbacks: [] }` se arquivos não existirem)
- [ ] T007 [P] Implementar `appendNotificacao(workspaceDir, notificacao)` em `.github/skills/study-gamification/repositories/character_repository.js` — lê `gamification_notifications.json` (cria se não existir), push da notificação, salva; campo `exibida: false` por padrão

**Checkpoint**: Padrão Repository completo — `character_repository.js` isola toda IO. `lerPersonagem()` retorna personagem padrão quando arquivo não existe; `lerEventos()` retorna listas vazias sem erro quando arquivos ausentes.

---

## Fase 3: História de Usuário 1 — XP por Revisão de Flashcard (Prioridade: P1) 🎯 MVP

**Objetivo**: Cada flashcard avaliado na spec 008 concede XP ao personagem com multiplicador de relevância.

**Teste Independente**: Criar `flashcard_events.json` manualmente com 1 evento `avaliacao: "bom"` + `relevancia: "alta"`. Chamar `getCharacter()`. Verificar `xp_total: 30` em `character_state.json`.

- [ ] T008 [P] [US1] Implementar `calcularXPRevisao(avaliacao, relevancia)` em `.github/skills/study-gamification/services/xp_service.js` — base: errei=5, dificil=10, bom=15, facil=20; multiplicador: alta×2, media×1.5, baixa×1, sem_classificacao×1; retorna número (Padrão Service Layer — função pura sem IO)
- [ ] T009 [P] [US1] Implementar `processarEventosRevisao(eventos, personagem)` em `.github/skills/study-gamification/gamification_service.js` — filtra eventos cujo `id` não está em `personagem.eventos_processados[]`; para cada evento novo: chama `calcularXPRevisao()`, acumula em `personagem.xp_total`, adiciona `id` a `personagem.eventos_processados[]`; retorna personagem atualizado (Padrão Event Sourcing Simplificado — idempotência garantida por lista de IDs)

**Checkpoint**: Padrão Service Layer + Event Sourcing Simplificado para US1 — `calcularXPRevisao("bom", "alta")` = 30; chamar `processarEventosRevisao` duas vezes com o mesmo evento não duplica XP.

---

## Fase 4: História de Usuário 2 — XP por Feedback de Resumo (Prioridade: P2)

**Objetivo**: Cada feedback de resumo submetido na spec 008 concede XP fixo ao personagem.

**Teste Independente**: Criar `summary_feedback.json` com 1 feedback `tipo_feedback: "com_erros"`. Chamar `getCharacter()`. Verificar `xp_total: 15` em `character_state.json`.

- [ ] T010 [P] [US2] Implementar `calcularXPFeedback(tipo_feedback)` em `.github/skills/study-gamification/services/xp_service.js` — correto=10, com_erros=15, observacao=12; retorna número (Padrão Service Layer — função pura)
- [ ] T011 [US2] Implementar `processarFeedbacks(feedbacks, personagem)` em `.github/skills/study-gamification/gamification_service.js` — filtra feedbacks cujo `id` não está em `personagem.eventos_processados[]`; para cada feedback novo: chama `calcularXPFeedback()`, acumula em `personagem.xp_total`, adiciona `id` a `personagem.eventos_processados[]`; retorna personagem atualizado (depende de T009 — mesmo padrão de idempotência)

**Checkpoint**: Padrão Service Layer completo para US2 — `calcularXPFeedback("com_erros")` = 15; processamento de feedbacks idempotente (reprocessar mesmo arquivo não duplica XP).

---

## Fase 5: História de Usuário 3 — Personagem com Nível e XP (Prioridade: P3)

**Objetivo**: Personagem tem nível calculado a partir do XP acumulado e é exposto via `getCharacter()` (consumido pelo endpoint `/api/character` da spec 008).

**Teste Independente**: Com `flashcard_events.json` com eventos que somem 250 XP, chamar `getCharacter()`. Verificar `nivel: 3` e `xp_para_proximo_nivel: 50`.

- [ ] T012 [P] [US3] Implementar `calcularNivel(xpTotal)` em `.github/skills/study-gamification/services/level_service.js` — retorna `{ nivel: Math.floor(xpTotal / 100) + 1, xpParaProximo: (Math.floor(xpTotal / 100) + 1) * 100 - xpTotal }` (Padrão Service Layer — função pura, fórmula documentada no plan.md)
- [ ] T013 [P] [US3] Implementar `atualizarNivel(personagem)` em `.github/skills/study-gamification/services/level_service.js` — chama `calcularNivel(personagem.xp_total)` e atualiza `personagem.nivel` e `personagem.xp_para_proximo_nivel` no objeto; retorna personagem
- [ ] T014 [US3] Implementar `getCharacter(workspaceDir)` em `.github/skills/study-gamification/gamification_service.js` — orquestra: (1) `lerPersonagem`, (2) `lerEventos`, (3) `processarEventosRevisao`, (4) `processarFeedbacks`, (5) `atualizarNivel`, (6) `salvarPersonagem`, (7) retorna personagem sem campo `eventos_processados` (removido antes do return para não expor ao frontend) — conforme contrato `gamification_module.md` (depende de T009, T011, T013)

**Checkpoint**: Padrão Event Sourcing Simplificado completo para US3 — `getCharacter()` retorna estado correto e persiste; chamadas repetidas sem novos eventos retornam mesmo resultado (idempotência end-to-end).

---

## Fase 6: História de Usuário 4 — Marcos de Desbloqueio (Prioridade: P4)

**Objetivo**: Ao atingir o nível de um marco, a conquista é registrada no personagem e uma notificação PT-BR é gerada.

**Teste Independente**: Forçar `xp_total: 300` em `character_state.json` e chamar `getCharacter()`. Verificar conquistas `modo_basico` (nível 1) e `modo_quiz` (nível 3) em `character_state.json` e notificação em `gamification_notifications.json`.

- [ ] T015 [P] [US4] Implementar array `MARCOS` em `.github/skills/study-gamification/services/level_service.js` — 6 entradas declarativas: `[{ nivel:1, id:'modo_basico', nome:'Modo Revisão Básico', descricao:'...' }, { nivel:3, id:'modo_quiz', ... }, ...]` conforme tabela do `data-model.md` (array declarativo — Princípio IX: legível e extensível)
- [ ] T016 [P] [US4] Implementar `verificarDesbloqueios(personagem)` em `.github/skills/study-gamification/services/level_service.js` — itera `MARCOS`; para cada marco onde `personagem.nivel >= marco.nivel` e conquista ainda não em `personagem.conquistas[]`: adiciona `{ id, nome, descricao, nivel_requerido: marco.nivel, desbloqueada_em: ISO8601 }`; retorna `{ personagem, conquistasNovas: [] }` (Padrão Service Layer — função pura que não persiste)
- [ ] T017 [US4] Integrar `verificarDesbloqueios` em `getCharacter()` em `gamification_service.js` — chamar após `atualizarNivel` (passo 5); inserir passo (5b): `verificarDesbloqueios(personagem)` e atualizar personagem com novas conquistas (depende de T014, T015, T016)
- [ ] T018 [US4] Implementar geração de notificação de nível novo em `getCharacter()` em `gamification_service.js` — detectar se `nivel` mudou comparando antes/depois do processamento; se sim, chamar `appendNotificacao()` com `{ tipo: "nivel_novo", nivel: novoNivel, mensagem: "Parabéns! Você chegou ao nível N..." + lista de conquistas novas em PT-BR, exibida: false }` (depende de T017)

**Checkpoint**: Padrão Event Sourcing Simplificado + Tabela Declarativa de Marcos completo para US4 — com XP suficiente para nível 3, `getCharacter()` retorna conquistas corretas e gera notificação em `gamification_notifications.json`.

---

## Fase Final: Polimento e Integração com Spec 008

**Objetivo**: Script standalone, integração com `/api/character` da spec 008, notificações no dashboard e conformidade com a constituição.

- [ ] T019 [P] Implementar `processAllEvents(workspaceDir)` em `.github/skills/study-gamification/gamification_service.js` — reseta `personagem.eventos_processados = []` e `personagem.xp_total = 0`, então chama a sequência completa de processamento; retorna `{ eventos_processados, xp_total, nivel, conquistas_desbloqueadas }` conforme contrato `gamification_module.md`
- [ ] T020 [P] Implementar `.github/skills/study-gamification/process_events.js` standalone — importa `gamification_service`, chama `processAllEvents(workspaceDir)`, imprime resumo PT-BR no console: "Processados N evento(s) | XP total: X | Nível: N | Conquistas: [lista]"
- [ ] T021 Atualizar `.github/skills/study-flashcard-web/routes/character.js` (spec 008) para importar e chamar `gamification_service.getCharacter(workspaceDir)` — substituir o stub/fallback pelo import real com try/catch que mantém o fallback se o módulo falhar (depende de T014)
- [ ] T022 Atualizar `.github/skills/study-flashcard-web/routes/dashboard.js` (spec 008) para incluir notificações pendentes de `gamification_notifications.json` na resposta do `GET /api/dashboard`; após entrega, marcar notificações como `exibida: true` e salvar (depende de T018, T021)
- [ ] T023 [P] Revisar todas as mensagens em `gamification_service.js` e `process_events.js` — garantir 100% PT-BR (Constitution I)
- [ ] T024 Validar todos os cenários de `specs/009-study-gamification/quickstart.md` — executar SC-001 a SC-004 incluindo teste de idempotência (rodar `process_events.js` 3 vezes e verificar XP constante)

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — **BLOQUEIA todas as histórias**
- **US1 (Fase 3)**: Depende da Fundação
- **US2 (Fase 4)**: Depende de US1 — reutiliza o mesmo mecanismo de idempotência de `eventos_processados`
- **US3 (Fase 5)**: Depende de US1 + US2 — `getCharacter` orquestra ambos
- **US4 (Fase 6)**: Depende de US3 — `verificarDesbloqueios` depende de `atualizarNivel`
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada obrigatória**: 008-study-flashcard-web (`flashcard_events.json`, `summary_feedback.json`)
- **Integração upstream**: spec 008 importa `gamification_service.getCharacter()` em `routes/character.js` (T021)
- **Saída**: `character_state.json` (estado do personagem), `gamification_notifications.json` (notificações para spec 008)

### Oportunidades de Paralelismo

- T004–T007 (Fundação): todos [P] — funções independentes no mesmo arquivo
- T008+T009 (US1): [P] — serviço e processador são arquivos distintos
- T010 (US2): [P] com T009 (arquivo diferente em `xp_service.js`)
- T012+T013 (US3): [P] — funções independentes em `level_service.js`
- T015+T016 (US4): [P] — tabela `MARCOS` e função `verificarDesbloqueios` no mesmo arquivo mas funções independentes
- T019+T020+T023 (Polimento): todos [P]

---

## Estratégia de Implementação

### MVP Primeiro (US1 + US3)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (Repository)
3. Completar Fase 3: US1 (XP por revisão)
4. Completar Fase 5: US3 (getCharacter)
5. **PARAR e VALIDAR**: `getCharacter()` retorna XP correto; integrar com spec 008 via T021
6. Adicionar US2 (feedback) e US4 (marcos) como incrementos

### Entrega Incremental

1. Setup + Fundação → Repository funcional
2. US1 + US3 → `getCharacter()` funcionando; `/api/character` da spec 008 retorna dados reais
3. US2 → Feedbacks de resumo geram XP
4. US4 → Marcos de desbloqueio + notificações
5. Polimento → script standalone + integração completa

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- **Idempotência é inegociável**: o campo `eventos_processados[]` é o mecanismo central de segurança — nunca remover sem substituto equivalente
- **Princípio IX**: `MARCOS` é um array declarativo — adicionar novo marco = adicionar uma linha; nunca usar `if/else` encadeado para verificar marcos
- **Princípio VI**: T021 e T022 atualizam arquivos da spec 008 (`routes/character.js` e `routes/dashboard.js`) — isso é a única interseção entre as duas specs; toda regra de gamificação permanece em `study-gamification/`
- **Princípio VIII**: `character_state.json` tem campo `version` — mudanças futuras no schema devem incrementar a versão e incluir migração
- `workspaceDir` em `process_events.js` standalone deve ser detectado via `path.resolve(__dirname, '../../../')` (3 níveis acima de `.github/skills/study-gamification/`)
