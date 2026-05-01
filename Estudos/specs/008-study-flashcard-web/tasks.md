# Tarefas: Study Flashcard Web

**Entrada**: Documentos de design em `/specs/008-study-flashcard-web/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/api_rest.md, research.md, quickstart.md
**Dependências obrigatórias**: 002-study-foundation, 004-study-summary-generation, 005-study-relevance-engine

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História?] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar a estrutura de arquivos e o servidor Express mínimo antes de qualquer lógica de negócio.

- [ ] T001 Criar diretório `.github/skills/study-flashcard-web/` com subdiretórios `routes/`, `services/`, `repositories/`, `public/`
- [ ] T002 Criar `.github/skills/study-flashcard-web/package.json` com `name`, `version: "1.0.0"`, `main: "server.js"`, `scripts: { "start": "node server.js" }` e `dependencies: { "express": "^4.18.0" }`
- [ ] T003 Instalar dependências: executar `npm install` em `.github/skills/study-flashcard-web/`
- [ ] T004 Criar `.github/skills/study-flashcard-web/server.js` com servidor Express mínimo: `express.json()`, `express.static('public')`, import das 4 rotas (stubs vazios), `app.listen(3000, ...)` com mensagem PT-BR de startup

**Checkpoint**: Estrutura criada. `node .github/skills/study-flashcard-web/server.js` inicia sem erros e responde em `http://localhost:3000`.

---

## Fase 2: Fundação — Repository + Services (Pré-requisitos Bloqueantes)

**Objetivo**: Criar as camadas de dados (repositories) e as regras de negócio puras (services). Sem estas camadas, nenhuma rota pode ser implementada.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem a fundação — repositories e services são os únicos pontos de acesso a dados e lógica de negócio.

- [ ] T005 [P] Implementar `lerJson(caminho, valorPadrao)` em `.github/skills/study-flashcard-web/utils/file_utils.js` — tenta `JSON.parse(fs.readFileSync(caminho, 'utf8'))`; retorna `valorPadrao` em caso de erro sem lançar exceção (leitura defensiva de arquivo — research.md seção 4)
- [ ] T006 [P] Implementar `lerTopicos(workspaceDir)` e `lerRelevancia(workspaceDir)` em `.github/skills/study-flashcard-web/repositories/topicos_repository.js` — usa `lerJson` para ler `/data/topicos.json` e `/data/relevancia_topicos.json`; retorna lista de tópicos e dict de relevância indexado por `id` (Padrão Repository)
- [ ] T007 [P] Implementar `lerProgresso(workspaceDir, materia)`, `salvarProgresso(workspaceDir, materia, progresso)`, `appendEvento(workspaceDir, evento)` e `appendFeedback(workspaceDir, feedback)` em `.github/skills/study-flashcard-web/repositories/progress_repository.js` — lê/escreve `/data/flashcard_progress_<materia>.json`, `/data/flashcard_events.json`, `/data/summary_feedback.json` (Padrão Repository — isola toda IO de progresso)
- [ ] T008 [P] Implementar `calcularProximaRevisao(card, q)` em `.github/skills/study-flashcard-web/services/srs_service.js` — fórmula SM-2 completa: se q≥3 atualiza intervalo e fator_facilidade; se q<3 reinicia intervalo=1 e repeticoes=0; calcula `proxima_revisao` como YYYY-MM-DD (research.md seção 1) (Padrão Service Layer — função pura sem IO)
- [ ] T009 [P] Implementar `calcularXP(avaliacao, relevancia)` em `.github/skills/study-flashcard-web/services/xp_service.js` — base: errei=5, dificil=10, bom=15, facil=20; multiplicador: alta=2, media=1.5, baixa=1, sem_classificacao=1; retorna número (Padrão Service Layer — função pura)
- [ ] T010 [P] Implementar `calcularXPFeedback(tipo_feedback)` em `.github/skills/study-flashcard-web/services/xp_service.js` — correto=10, com_erros=15, observacao=12; retorna número
- [ ] T011 [P] Implementar `montarCard(topico, progressoCard, relevanciaDict, materia)` em `.github/skills/study-flashcard-web/services/flashcard_service.js` — frente = L0 (truncado em 120 chars + "..."); verso = L1+L2 concatenados com "\n\n"; inclui campo `relevancia` e `proxima_revisao` do progresso (ou hoje se card novo) (Padrão Service Layer)
- [ ] T012 Implementar `filtrarPendentesOrdenados(cards, dataHoje)` em `.github/skills/study-flashcard-web/services/flashcard_service.js` — retorna cards com `proxima_revisao <= dataHoje`, ordenados: alta relevância primeiro, depois media, depois baixa (depende de T011)
- [ ] T013 Criar stubs de rota em `routes/cards.js`, `routes/feedback.js`, `routes/character.js`, `routes/dashboard.js` — cada arquivo exporta `express.Router()` com rota stub que retorna `{ status: "em construção" }` (permite `server.js` importar sem erros)

**Checkpoint**: Padrão Repository + Service Layer completo — `srs_service.js`, `xp_service.js` e `flashcard_service.js` são funções puras; repositories isolam toda leitura/escrita de JSON. `node server.js` inicia e responde com stubs. Lógica de negócio testável via `node -e`.

---

## Fase 3: História de Usuário 1 — Iniciar Sessão de Revisão (Prioridade: P1) 🎯 MVP

**Objetivo**: Usuário acessa o browser, vê lista de matérias com cards pendentes e inicia uma sessão de revisão.

**Teste Independente**: Com `topicos.json` presente e servidor rodando, acessar `http://localhost:3000` e verificar que matérias aparecem com contagem de cards pendentes para hoje.

- [ ] T014 [P] [US1] Implementar `GET /api/materias` em `.github/skills/study-flashcard-web/routes/cards.js` — chama `lerTopicos()`, agrupa por matéria, cruza com `lerProgresso()` para contar cards com `proxima_revisao <= hoje`, retorna JSON conforme contrato `api_rest.md`
- [ ] T015 [P] [US1] Criar `.github/skills/study-flashcard-web/public/index.html` — página HTML com título PT-BR, lista de matérias carregada via `fetch('/api/materias')`, cada matéria exibe nome e contagem de cards pendentes, clique navega para `review.html?materia=<id>`
- [ ] T016 [US1] Implementar `GET /api/cards?materia=<id>` em `.github/skills/study-flashcard-web/routes/cards.js` — valida parâmetro `materia`, chama `lerTopicos()` + `lerRelevancia()` + `lerProgresso()`, monta cards via `montarCard()`, filtra com `filtrarPendentesOrdenados()`, retorna lista conforme contrato (depende de T014)
- [ ] T017 [US1] Adicionar tratamento de erros PT-BR em `routes/cards.js` — 400 para parâmetro ausente, 404 para matéria sem tópicos, 500 genérico com mensagem PT-BR

**Checkpoint**: Padrão MVC Simplificado completo para US1 — `routes/cards.js` é o Controller, `flashcard_service.js` o Service, `topicos_repository.js` o Repository. `http://localhost:3000` exibe lista de matérias com contagem correta de cards pendentes.

---

## Fase 4: História de Usuário 2 — Revisar Flashcard (Prioridade: P2)

**Objetivo**: Usuário vê frente do card, revela o verso e avalia dificuldade com 4 botões. Progresso SM-2 e evento são persistidos.

**Teste Independente**: Com sessão ativa, clicar "Revelar" → avaliar "Bom" → verificar `flashcard_progress_<mat>.json` atualizado e novo evento em `flashcard_events.json`.

- [ ] T018 [P] [US2] Criar `.github/skills/study-flashcard-web/public/review.html` — estrutura HTML: área da frente do card, botão "Revelar", área do verso (oculta inicialmente), 4 botões de avaliação desabilitados (Errei / Difícil / Bom / Fácil), área de resultado pós-avaliação (XP ganho, próxima revisão)
- [ ] T019 [P] [US2] Criar `.github/skills/study-flashcard-web/public/style.css` — estilos básicos: layout centralizado, card com frente/verso, botões coloridos por dificuldade (vermelho=Errei, laranja=Difícil, verde=Bom, azul=Fácil), responsivo
- [ ] T020 [P] [US2] Implementar lógica de sessão em `.github/skills/study-flashcard-web/public/app.js` — ao carregar `review.html`: faz `fetch('/api/cards?materia=<id>')`, armazena fila de cards, exibe primeiro card; função `revelar()` exibe verso e habilita botões; função `avaliar(avaliacao)` faz `POST /api/review` e avança para próximo card
- [ ] T021 [US2] Implementar `POST /api/review` em `.github/skills/study-flashcard-web/routes/cards.js` — valida campos `{ topico_id, materia, avaliacao }`; chama `srs_service.calcularProximaRevisao()`; chama `xp_service.calcularXP()`; chama `progress_repository.salvarProgresso()` e `appendEvento()`; retorna `{ xp_concedido, proximo_intervalo_dias, proxima_revisao }` conforme contrato
- [ ] T022 [US2] Implementar exibição de resultado em `public/app.js` — após `POST /api/review`, exibe XP ganho e próxima revisão antes de carregar próximo card; ao fim da sessão exibe resumo total (cards revisados, XP total)

**Checkpoint**: Padrão Event-Driven via Arquivo completo para US2 — `POST /api/review` persiste progresso SM-2 e emite evento. Fluxo end-to-end funcional: selecionar matéria → revelar card → avaliar → verificar `flashcard_progress_*.json` e `flashcard_events.json` atualizados.

---

## Fase 5: História de Usuário 3 — Feedback de Resumo (Prioridade: P3)

**Objetivo**: Durante revisão, usuário acessa resumo vinculado ao card e registra feedback (Correto / Com erros / Observação).

**Teste Independente**: Clicar "Ver resumo" → selecionar "Com erros" → confirmar → verificar novo registro em `summary_feedback.json`.

- [ ] T023 [P] [US3] Adicionar seção de feedback em `.github/skills/study-flashcard-web/public/review.html` — botão "Ver resumo" abaixo do verso; painel de feedback com 3 botões (Correto / Com erros / Observação) e campo de texto para observação (visível apenas quando "Observação" selecionado) e botão "Confirmar feedback"
- [ ] T024 [P] [US3] Implementar `POST /api/feedback` em `.github/skills/study-flashcard-web/routes/feedback.js` — valida `{ topico_id, materia, tipo_feedback, observacao }`; valida que `observacao` é presente quando `tipo_feedback == "observacao"`; chama `xp_service.calcularXPFeedback()`; chama `progress_repository.appendFeedback()`; retorna `{ xp_concedido, mensagem }` conforme contrato
- [ ] T025 [US3] Implementar lógica de feedback em `public/app.js` — exibe campo de texto quando "Observação" selecionado; faz `POST /api/feedback`; exibe confirmação PT-BR com XP ganho; oculta painel após envio

**Checkpoint**: Padrão Event-Driven via Arquivo completo para US3 — `summary_feedback.json` recebe registro append-only. Verificar arquivo após envio de feedback.

---

## Fase 6: História de Usuário 4 — Dashboard de Progresso (Prioridade: P4)

**Objetivo**: Usuário visualiza cards revisados hoje, streak, XP total, nível do personagem e previsão de revisões.

**Teste Independente**: Acessar `http://localhost:3000/dashboard` após revisar ao menos um card e verificar que dados refletem as revisões realizadas.

- [ ] T026 [P] [US4] Implementar `GET /api/dashboard` em `.github/skills/study-flashcard-web/routes/dashboard.js` — lê `flashcard_events.json`, conta eventos de hoje, calcula streak (dias consecutivos com ao menos um evento), soma XP total; lê todos `flashcard_progress_*.json` para previsão dos próximos 7 dias; retorna JSON conforme contrato
- [ ] T027 [P] [US4] Implementar `GET /api/character` em `.github/skills/study-flashcard-web/routes/character.js` — tenta `require('../../study-gamification/gamification_service').getCharacter(workspaceDir)`; se módulo não encontrado ou erro, retorna objeto fallback `{ nome, nivel:1, xp_total:0, xp_para_proximo_nivel:100, conquistas:[], _aviso: "..." }` (Padrão Fallback Defensivo)
- [ ] T028 [US4] Criar `.github/skills/study-flashcard-web/public/dashboard.html` — faz `fetch('/api/dashboard')` e `fetch('/api/character')`; exibe: cards hoje, streak, XP total, nível do personagem, lista de próximas revisões por dia; exibe conquistas desbloqueadas se disponíveis

**Checkpoint**: Padrão Fallback Defensivo completo — `/api/character` funciona mesmo sem spec 009 implementada. Dashboard carrega e exibe dados corretos.

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos de borda da spec.

- [ ] T029 [P] Revisar todas as mensagens ao usuário em `routes/` e `public/` — garantir 100% em PT-BR (Constitution I)
- [ ] T030 [P] Adicionar tratamento de erro global em `.github/skills/study-flashcard-web/server.js` — middleware Express `(err, req, res, next)` que retorna `{ erro: "Erro interno do servidor. Tente novamente." }` com status 500
- [ ] T031 [P] Implementar truncamento de frente de card em `flashcard_service.js` — frente > 120 chars: truncar em 120 + "..." e adicionar texto completo no início do verso (edge case da spec)
- [ ] T032 Validar todos os cenários de `specs/008-study-flashcard-web/quickstart.md` — executar com `topicos.json` real e verificar SC-001 a SC-005

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — **BLOQUEIA todas as histórias**
- **US1 (Fase 3)**: Depende da Fundação
- **US2 (Fase 4)**: Depende da Fundação + US1 (sessão precisa existir para revisar)
- **US3 (Fase 5)**: Depende da Fundação + US2 (`review.html` deve existir)
- **US4 (Fase 6)**: Depende da Fundação; independente de US2/US3 (lê arquivos diretamente)
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada obrigatória**: 002-study-foundation; 004-study-summary-generation (`topicos.json`); 005-study-relevance-engine (`relevancia_topicos.json`)
- **Integração downstream**: spec 009 (`gamification_service`) — opcional via fallback em T027
- **Saída**: `flashcard_events.json` e `summary_feedback.json` (consumidos pela spec 009)

### Oportunidades de Paralelismo

- T005–T013 (Fundação): todos [P] podem rodar em paralelo (arquivos distintos)
- T014+T015 (US1): em paralelo — rota e HTML independentes
- T018+T019+T020 (US2): em paralelo — HTML, CSS e JS de frontend independentes
- T023+T024 (US3): em paralelo — HTML e rota independentes
- T026+T027 (US4): em paralelo — duas rotas distintas

---

## Estratégia de Implementação

### MVP Primeiro (US1 + US2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação
3. Completar Fase 3: US1 (seleção de matéria)
4. Completar Fase 4: US2 (revisão de card)
5. **PARAR e VALIDAR**: Fluxo end-to-end — selecionar matéria → revisar → verificar JSONs
6. Adicionar US3 (feedback) como incremento
7. Adicionar US4 (dashboard) como incremento final

### Entrega Incremental

1. Setup + Fundação → servidor iniciando com repositories e services funcionais
2. US1 → lista de matérias no browser
3. US2 → revisão completa com SM-2 e eventos persistidos
4. US3 → feedback de resumo integrado
5. US4 → dashboard com dados reais

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- **Princípio VIII**: API REST (`/api/...`) é o contrato imutável com o frontend — não modificar nomes de endpoint nem estrutura de resposta após implementados
- **Princípio IX**: `srs_service.js` e `xp_service.js` são funções puras — se alguma crescer além de 50 linhas, dividir em funções menores com responsabilidade única
- **Princípio IV**: `flashcard_events.json` e `summary_feedback.json` são append-only — sempre ler + push + salvar; nunca sobrescrever o array completo sem manter registros anteriores
- `workspaceDir` deve ser sempre a raiz do repositório — passar via `path.resolve(__dirname, '../../../')` no `server.js`
