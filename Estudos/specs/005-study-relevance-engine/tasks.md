# Tarefas: Study Relevance Engine

**Entrada**: Documentos de design em `/specs/005-study-relevance-engine/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/
**Dependências obrigatórias**: 002-study-foundation, 004-study-summary-generation. 003 é opcional (enriquece classificação).

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar a estrutura de arquivos da skill antes de qualquer implementação.

- [ ] T001 Criar diretório `.github/skills/study-relevance/` e arquivo `.github/skills/study-relevance/__init__.py` vazio

**Checkpoint**: Estrutura de diretório criada — implementação pode começar.

---

## Fase 2: Fundação — Repository: Leitura e Escrita de Dados

**Objetivo**: Criar `relevance_repository.py`, que isola todo o IO desta skill. Sem este módulo, nenhuma lógica de classificação pode ser testada com dados reais. O Repository é a fundação desta feature.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem o Repository — ele é o único ponto de leitura e escrita de dados desta skill.

- [ ] T002 [P] Implementar `carregar_topicos(workspace_dir) -> list` em `.github/skills/study-relevance/relevance_repository.py` — lê e valida `/data/topicos.json`; verifica schema e campo `version`; retorna lista de tópicos Python (Padrão Repository) (FR-007, FR-009)
- [ ] T003 [P] Implementar `carregar_questoes(workspace_dir) -> list` em `.github/skills/study-relevance/relevance_repository.py` — lê e valida `/data/questoes.json`; retorna lista de questões ou lista vazia se arquivo não existe (Padrão Repository) (FR-002, FR-009)
- [ ] T004 [P] Implementar `carregar_edital(workspace_dir) -> dict | None` em `.github/skills/study-relevance/relevance_repository.py` — lê `/data/edital_parsed.json` se existir; retorna `None` sem erro quando ausente (FR-004, FR-005, FR-009)
- [ ] T005 [P] Implementar `verificar_classificacao_existente(workspace_dir) -> bool` em `.github/skills/study-relevance/relevance_repository.py` — verifica se `/data/relevancia_topicos.json` já existe; usado para pergunta "Reclassificar ou reutilizar?" (US1 cenário 4) (FR-007)
- [ ] T006 Implementar `salvar_relevancia_topicos(classificacoes, workspace_dir)` em `.github/skills/study-relevance/relevance_repository.py` — persiste lista de ClassificacaoTopico em `/data/relevancia_topicos.json` com contrato da spec 002; usa `confirmar_sobrescrita()` se já existir (FR-007)
- [ ] T007 Implementar `salvar_relevancia_questoes(classificacoes, workspace_dir)` em `.github/skills/study-relevance/relevance_repository.py` — persiste lista de ClassificacaoQuestao em `/data/relevancia_questoes.json` com contrato da spec 002; usa `confirmar_sobrescrita()` se já existir (FR-007)

**Checkpoint**: Padrão Repository completo — `relevance_repository.py` lê `topicos.json` e retorna lista Python; escreve arquivo de saída com dados de teste. Lógica de classificação pode começar sem conhecer nada sobre arquivos JSON.

---

## Fase 3: História de Usuário 1 — Classificação de Tópicos por Relevância (Prioridade: P1) 🎯 MVP

**Objetivo**: Sistema classifica cada tópico L1 de `/data/topicos.json` com nível 🔥/⚠️/📝, justificativa e fontes rastreáveis, persistindo em `/data/relevancia_topicos.json`.

**Teste Independente**: Com `/data/topicos.json` existente, invocar classificação e verificar que `/data/relevancia_topicos.json` é gerado com classificação, justificativa e fontes para cada tópico.

- [ ] T008 [P] Implementar `EstrategiaComEdital` em `.github/skills/study-relevance/classification_strategies.py` — recebe tópico e `edital_data`; cruza tópico com conteúdo programático; retorna sugestão de nível (🔥/⚠️/📝), justificativa e fontes `["edital", "ia"]` (Padrão Strategy) (FR-004)
- [ ] T009 [P] Implementar `EstrategiaSemEdital` em `.github/skills/study-relevance/classification_strategies.py` — recebe tópico sem referência de edital; usa inferência do modelo; retorna sugestão + aviso de confiança reduzida + fontes `["ia"]`; confiança marcada como "media" ou "baixa" (Padrão Strategy) (FR-005)
- [ ] T010 Implementar `classificar_topicos(topicos, estrategia) -> list` em `.github/skills/study-relevance/relevance_classifier.py` — recebe lista de tópicos e estratégia como parâmetro; aplica estratégia a cada tópico; retorna lista de `ClassificacaoTopico` com campos: id_topico, texto, classificacao, justificativa, fontes, nivel_confianca (Padrão Pure Function — sem IO, sem efeitos colaterais) (FR-001, FR-003)
- [ ] T011 Implementar Chain of Evidence em `classificar_topicos()` — cada `ClassificacaoTopico` retornado DEVE ter justificativa (1–2 frases) e fontes rastreáveis preenchidos; lança `ValueError` se campos obrigatórios estiverem ausentes (FR-003, FR-010)

**Checkpoint**: Padrão Pure Function + Strategy completo — `classificar_topicos()` recebe dados e retorna dados; sem IO; dado mesmo input sempre retorna mesmo output. Com lista de tópicos Python e `EstrategiaComEdital` instanciada, `classificar_topicos()` retorna lista completa com todos os campos preenchidos.

---

## Fase 4: História de Usuário 2 — Classificação de Questões por Relevância (Prioridade: P2)

**Objetivo**: Sistema classifica cada questão de `/data/questoes.json` com o mesmo critério e formato dos tópicos.

**Teste Independente**: Com `/data/questoes.json` existente, invocar classificação de questões e verificar que `/data/relevancia_questoes.json` é gerado com o mesmo formato de `relevancia_topicos.json`.

- [ ] T012 Implementar `classificar_questoes(questoes, estrategia) -> list` em `.github/skills/study-relevance/relevance_classifier.py` — mesmo padrão de `classificar_topicos()`; usa o tema principal da questão para determinar classificação; retorna lista de `ClassificacaoQuestao` (Padrão Pure Function) (FR-002, FR-003)
- [ ] T013 Implementar lógica de tema principal em `classificar_questoes()` — quando questão referencia múltiplos temas, usa o tema de maior relevância para determinar classificação (US2 cenário 2) (FR-002)

**Checkpoint**: Padrão Pure Function estendido — `classificar_questoes()` segue exatamente o mesmo contrato de `classificar_topicos()`; specs downstream consomem ambos os resultados no mesmo formato.

---

## Fase 5: História de Usuário 3 — Resumo de Classificação (Prioridade: P3)

**Objetivo**: Sistema gera resumo estatístico `{alta: N, media: M, baixa: K}` com fontes consultadas e nível RAG utilizado; modo debug exibe justificativas de cada classificação.

**Teste Independente**: Após classificação, verificar que o resumo retornado contém contagens por nível corretas e lista de fontes consultadas.

- [ ] T014 Implementar `gerar_resumo(classificacoes_topicos, classificacoes_questoes) -> dict` em `.github/skills/study-relevance/relevance_service.py` — agrega contagens `{alta: N, media: M, baixa: K}`, lista de fontes únicas consultadas e nível RAG ("RAG 1 — sem web search") (FR-008)
- [ ] T015 Implementar `escolher_estrategia(edital_data) -> EstrategiaBase` em `.github/skills/study-relevance/relevance_service.py` — retorna `EstrategiaComEdital` se `edital_data` não é `None`; retorna `EstrategiaSemEdital` caso contrário; informa usuário em PT-BR quando operando sem edital (FR-005)
- [ ] T016 Implementar `executar_classificacao(workspace_dir, debug_mode) -> dict` em `.github/skills/study-relevance/relevance_service.py` — orquestra fluxo completo: (1) Repository lê dados, (2) `escolher_estrategia`, (3) `classificar_topicos`, (4) `classificar_questoes`, (5) Repository persiste, (6) `gerar_resumo`, (7) log cada decisão via Foundation; verifica classificação existente e pergunta ao usuário antes de reclassificar (FR-007, FR-010)
- [ ] T017 Implementar exibição de justificativas no modo debug em `executar_classificacao()` — quando `debug_mode=True`, exibe justificativa de cada classificação no chat via Foundation (US3 cenário 2) (FR-010)

**Checkpoint**: Padrão Service Layer completo — `relevance_service.py` é o único arquivo que conhece todos os outros; orquestra Repository + Strategies + Classifier em fluxo coeso. Pipeline end-to-end funcional com `topicos.json` e `questoes.json` presentes.

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos extremos.

- [ ] T018 [P] Revisar todas as mensagens ao usuário em `.github/skills/study-relevance/` — garantir 100% em PT-BR
- [ ] T019 [P] Adicionar tratamento de `topicos.json` vazio em `relevance_repository.py` — informar "Não há tópicos para classificar" e encerrar fase (edge case da spec) (FR-001)
- [ ] T020 [P] Adicionar alerta de classificação não-discriminativa em `gerar_resumo()` — quando todos os tópicos recebem o mesmo nível, alertar usuário e sugerir fornecer edital (edge case da spec)
- [ ] T021 Validar todos os cenários de teste de `specs/005-study-relevance-engine/quickstart.md` — executar com `topicos.json` real e verificar SC-001 a SC-004

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — BLOQUEIA todas as histórias
- **US1 (Fase 3)**: Depende da Fundação (Repository pronto)
- **US2 (Fase 4)**: Depende de US1 — reutiliza `relevance_classifier.py` e strategies
- **US3 (Fase 5)**: Depende de US1 + US2 — `relevance_service.py` orquestra tudo
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada obrigatória**: 002-study-foundation (memória, logging, contratos); 004-study-summary-generation (`topicos.json`, `questoes.json`)
- **Entrada opcional**: 003-study-edital-processing (`edital_parsed.json` — enriquece para `EstrategiaComEdital`)
- **Saída para**: 006-study-gdoc-publishing e 007-study-anki-export (ambos consomem `relevancia_topicos.json`)

### Oportunidades de Paralelismo

- T002, T003, T004 e T005 (Fundação): quatro funções de leitura independentes no Repository
- T008 e T009 (US1): duas estratégias independentes no mesmo arquivo

---

## Estratégia de Implementação

### MVP Primeiro (US1 + US3 mínimo)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (Repository)
3. Completar Fase 3: US1 (Classificação de tópicos)
4. Completar Fase 5 mínimo: `executar_classificacao()` sem US2
5. **PARAR e VALIDAR**: `relevancia_topicos.json` gerado com classificação completa
6. Adicionar US2 e resumo estatístico

### Entrega Incremental

1. Setup + Fundação → Repository pronto
2. US1 (Tópicos) → `relevancia_topicos.json` disponível para specs 006/007
3. US2 (Questões) → `relevancia_questoes.json` disponível
4. US3 (Service + Resumo) → pipeline end-to-end com estatísticas e logging

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- **Princípio IX**: `relevance_classifier.py` (Padrão Pure Function) NUNCA deve fazer IO — se precisar de dados externos, eles devem ser passados como parâmetros; dividir se a função crescer além de uma responsabilidade
- A Chain of Evidence (Princípio VII) — campos `justificativa`, `fontes` e `nivel_confianca` — é obrigatória em CADA classificação; não opcional
