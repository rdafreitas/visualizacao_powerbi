# Tarefas: Study Summary Generation

**Entrada**: Documentos de design em `/specs/004-study-summary-generation/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/
**Dependência obrigatória**: 002-study-foundation deve estar implementada antes desta spec.

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar a estrutura de arquivos da skill antes de qualquer implementação.

- [ ] T001 Criar diretório `.github/skills/study-summary/` e arquivo `.github/skills/study-summary/__init__.py` vazio

**Checkpoint**: Estrutura de diretório criada — implementação pode começar.

---

## Fase 2: Fundação — Esqueleto do Pipeline e Ponto de Entrada

**Objetivo**: Criar o `summary_service.py` com o esqueleto do Pipeline antes de implementar cada etapa. O Pipeline define a ordem explícita das transformações: PDF → Markdown → {matéria, questões} → Outline → persistência.

**⚠️ CRÍTICO**: O esqueleto do pipeline deve existir antes das histórias de usuário; cada US implementa uma etapa do pipeline.

- [ ] T002 Implementar esqueleto de `processar_material(caminho_pdf, workspace_dir, debug_mode)` em `.github/skills/study-summary/summary_service.py` — define sequência do Pipeline com chamadas ainda não implementadas: `converter_pdf → separar_conteudo → gerar_outline → persistir`; cada etapa registra log via Foundation (Padrão Pipeline) (plan.md — Fase geral)
- [ ] T003 Implementar verificação de `pip install markitdown` como pré-requisito em `summary_service.py` — testa `import markitdown` e instrui usuário em PT-BR a instalar se ausente

**Checkpoint**: Padrão Pipeline definido — sequência de transformações documentada no código antes de implementar cada etapa.

---

## Fase 3: História de Usuário 1 — Conversão de PDF para Markdown (Prioridade: P1) 🎯 MVP

**Objetivo**: PDF de material de estudo é convertido para Markdown preservando estrutura textual (títulos, parágrafos, listas).

**Teste Independente**: Fornecer um PDF com texto extraível e verificar que arquivo `.md` é gerado preservando títulos e parágrafos do original.

- [ ] T004 [P] Implementar `calcular_hash(caminho_pdf)` em `.github/skills/study-summary/pdf_converter.py` — retorna SHA-256 via `hashlib` para detecção de reprocessamento (FR-001)
- [ ] T005 [P] Implementar `verificar_pdf_extraivel(caminho_pdf)` em `.github/skills/study-summary/pdf_converter.py` — tenta conversão de amostra via MarkItDown; retorna bool; informa ao usuário se PDF é escaneado ou protegido (FR-001)
- [ ] T006 Implementar `converter_pdf(caminho_pdf) -> str` em `.github/skills/study-summary/pdf_converter.py` — converte PDF para string Markdown via MarkItDown (Padrão Facade — interface simples: recebe caminho, retorna texto); registra log de início, fim e status via Foundation (FR-001)
- [ ] T007 Implementar detecção de reprocessamento em `converter_pdf()` — verifica hash do PDF contra `study-memory.json`; pergunta "Reconverter ou reutilizar?" via `confirmation.py` da spec 002 quando Markdown já existe (FR-001, US1 cenário 3)

**Checkpoint**: Padrão Facade completo — `pdf_converter.py` encapsula MarkItDown; o restante do pipeline recebe string Markdown sem saber que MarkItDown existe.

---

## Fase 4: História de Usuário 2 — Separação de Matéria e Questões (Prioridade: P2)

**Objetivo**: Markdown misto é separado em matéria explicativa (tópicos) e questões (exercícios com alternativas e gabarito), persistidos em `/data/topicos.json` e `/data/questoes.json`.

**Teste Independente**: Fornecer Markdown com matéria e questões intercaladas e verificar que `/data/topicos.json` e `/data/questoes.json` são gerados corretamente.

- [ ] T008 [P] Implementar `EstrategiaEnunciado` em `.github/skills/study-summary/content_splitter.py` — detecta padrões de enunciado: "Questão", "Q.", "01.", numeração com ponto (Padrão Strategy) (FR-002)
- [ ] T009 [P] Implementar `EstrategiaAlternativas` em `.github/skills/study-summary/content_splitter.py` — detecta blocos com linhas começando em "A)", "B)", "C)", "D)", "E)" (Padrão Strategy) (FR-002)
- [ ] T010 [P] Implementar `EstrategiaGabarito` em `.github/skills/study-summary/content_splitter.py` — detecta seções "Gabarito", "Resposta:", "Comentário:" (Padrão Strategy) (FR-002)
- [ ] T011 [P] Implementar `EstrategiaDefault` em `.github/skills/study-summary/content_splitter.py` — classifica como matéria quando nenhuma outra estratégia detecta padrão com confiança suficiente (Padrão Strategy — fallback) (FR-002)
- [ ] T012 Implementar `separar_conteudo(markdown_texto, estrategias) -> dict` em `.github/skills/study-summary/content_splitter.py` — aplica estratégias em sequência; retorna `{"materia": [...], "questoes": [...]}` com cada questão contendo: id sequencial, enunciado, alternativas, gabarito (FR-002, FR-012)
- [ ] T013 Implementar persistência de resultado provisório em `separar_conteudo()` — chama `topic_repository.py` para salvar `topicos.json` (provisório, sem outline ainda) e `questoes.json`; usa `confirmar_sobrescrita()` se arquivos existirem (FR-003)

**Checkpoint**: Padrão Strategy completo — `content_splitter.py` tenta estratégias em sequência; adicionar suporte a novo padrão de concurso = criar nova estratégia sem alterar código existente.

---

## Fase 5: História de Usuário 3 — Geração de Outline Hierárquico L0–L3 (Prioridade: P3)

**Objetivo**: Matéria explicativa é transformada em outline hierárquico com 4 níveis (L0/L1❖/L2➤/L3■), IDs sequenciais e limite de 15 palavras no L2, persistido em `_topicos.txt` e `topicos.json` atualizado.

**Teste Independente**: Fornecer `/data/topicos.json` com matéria e verificar que `_topicos.txt` é gerado com hierarquia L0–L3, marcadores corretos e IDs no formato `t001`, `t001.1`, `t001.1.1`.

- [ ] T014 Implementar `classificar_linha_nivel(linha) -> dict` em `.github/skills/study-summary/outline_builder.py` — classifica cada linha do outline gerado pelo Claude em L0, L1 (❖), L2 (➤) ou L3 (■) com base no marcador prefixado (FR-004, FR-005)
- [ ] T015 Implementar `gerar_id_topico(nivel, posicao_pai)` em `.github/skills/study-summary/outline_builder.py` — gera ID hierárquico: L0 = `t001`, L1 = `t001.1`, L2 = `t001.1.1`, L3 = `t001.1.1.1` (FR-005, FR-011)
- [ ] T016 Implementar `validar_limite_l2(texto_linha) -> bool` em `.github/skills/study-summary/outline_builder.py` — conta palavras; retorna `False` se L2 excede 15 palavras; o agente deve regerar aquela linha (FR-007)
- [ ] T017 Implementar `construir_arvore(linhas_classificadas) -> list` em `.github/skills/study-summary/outline_builder.py` — monta estrutura de árvore com `children` aninhados a partir de linhas classificadas por nível (Padrão Builder — montagem incremental passo a passo) (FR-004)
- [ ] T018 Implementar `gerar_outline(materia_texto, workspace_dir) -> dict` em `.github/skills/study-summary/outline_builder.py` — chama agente Claude com prompt estruturado para gerar outline L0–L3 com marcadores corretos; valida cada linha L2 com limite de 15 palavras; usa `classificar_linha_nivel` + `construir_arvore` para montar o resultado final (FR-004, FR-006, FR-007)

**Checkpoint**: Padrão Builder completo — `outline_builder.py` recebe linhas do Claude e monta árvore hierárquica com IDs; a geração de IDs e a montagem da árvore são responsabilidades separadas das chamadas ao Claude.

---

## Fase 6: História de Usuário 4 — Alinhamento com Referência Editorial (Prioridade: P4)

**Objetivo**: Quando Google Docs de referência editorial estão disponíveis, a granularidade do outline gerado (profundidade e número de subtópicos) é calibrada com o padrão do usuário.

**Teste Independente**: Gerar outline para uma matéria e verificar que a profundidade média se alinha com o doc de referência da mesma matéria (tolerância ±20%).

- [ ] T019 [P] Implementar `salvar_topicos(topicos_dict, workspace_dir)` em `.github/skills/study-summary/topic_repository.py` — persiste `topicos.json` com contrato da spec 002 (meta + data); usa `confirmar_sobrescrita()` antes de sobrescrever (Padrão Repository) (FR-003, FR-011)
- [ ] T020 [P] Implementar `salvar_questoes(questoes_list, workspace_dir)` em `.github/skills/study-summary/topic_repository.py` — persiste `questoes.json` com contrato da spec 002 (Padrão Repository) (FR-003, FR-012)
- [ ] T021 [P] Implementar `salvar_outline_txt(outline_texto, workspace_dir)` em `.github/skills/study-summary/topic_repository.py` — escreve `_topicos.txt` no diretório de trabalho; confirma sobrescrita se já existir (FR-010)
- [ ] T022 [P] Implementar `carregar_referencias_editoriais(caminho_google_drive)` em `.github/skills/study-summary/topic_repository.py` — tenta listar Google Docs em `Meu Drive/02-Renan (Anotações)/01-Concursos/Aprofundamento/`; retorna lista vazia sem erro quando inacessível (FR-009)
- [ ] T023 Implementar `calibrar_granularidade(outline_gerado, referencias)` em `.github/skills/study-summary/topic_repository.py` — quando referências disponíveis, ajusta profundidade média do outline para ±20% da referência; usa padrão default quando sem referências e informa usuário (FR-008, FR-009)

**Checkpoint**: Padrão Repository completo — `topic_repository.py` isola toda persistência; alinhamento editorial é adicionado sem alterar outline_builder ou summary_service.

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos extremos.

- [ ] T024 [P] Revisar todas as mensagens ao usuário em `.github/skills/study-summary/` — garantir 100% em PT-BR
- [ ] T025 [P] Adicionar tratamento de PDF com formatação complexa (duas colunas, rodapés) em `pdf_converter.py` — alertar usuário sobre possíveis perdas de formatação (edge case da spec)
- [ ] T026 Validar todos os cenários de teste de `specs/004-study-summary-generation/quickstart.md` — executar com PDF real de concurso e verificar SC-001 a SC-005

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — BLOQUEIA todas as histórias
- **US1 (Fase 3)**: Depende da Fundação; depende de 002-study-foundation instalada
- **US2 (Fase 4)**: Depende de US1 — precisa do Markdown para separar conteúdo
- **US3 (Fase 5)**: Depende de US2 — precisa de `topicos.json` provisório
- **US4 (Fase 6)**: Depende de US3 — calibra granularidade do outline gerado
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada**: 002-study-foundation (obrigatória); 003-study-edital-processing (opcional — contexto de matéria/banca para metadados)
- **Saída para**: 005, 006, 007 — todos consomem `topicos.json`, `questoes.json` e `_topicos.txt`

### Oportunidades de Paralelismo

- T004 e T005 (US1): funções independentes no mesmo arquivo
- T008, T009, T010 e T011 (US2): quatro estratégias distintas, sem dependência entre si
- T019, T020, T021 e T022 (US4): funções de Repository independentes entre si

---

## Estratégia de Implementação

### MVP Primeiro (US1 + US2 + US3)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (esqueleto do Pipeline)
3. Completar Fase 3: US1 (Conversão PDF → Markdown)
4. Completar Fase 4: US2 (Separação matéria/questões)
5. Completar Fase 5: US3 (Outline L0–L3)
6. **PARAR e VALIDAR**: PDF → `topicos.json` + `questoes.json` + `_topicos.txt`
7. US4 (Alinhamento editorial) é incremento opcional

### Entrega Incremental

1. Setup + Fundação → Pipeline definido
2. US1 (Conversão) → Markdown disponível
3. US2 (Separação) → `topicos.json` + `questoes.json` disponíveis para specs 005/006/007
4. US3 (Outline) → `_topicos.txt` com hierarquia L0–L3 completa
5. US4 (Alinhamento) → personalização com padrão editorial do usuário

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- **Princípio IX**: `outline_builder.py` (Fase 5) separa a chamada ao Claude (o QUÊ gerar) da montagem da árvore (COMO montar) — duas responsabilidades distintas em funções distintas
- O limit de 15 palavras no L2 (FR-007) deve ser validado antes de persistir — `validar_limite_l2()` deve ser chamado dentro de `gerar_outline()` para cada linha L2
