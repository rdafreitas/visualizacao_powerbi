# Tarefas: Study Edital Processing

**Entrada**: Documentos de design em `/specs/003-study-edital-processing/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/
**Dependência obrigatória**: 002-study-foundation deve estar implementada antes desta spec.

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar a estrutura de arquivos da skill antes de qualquer implementação.

- [ ] T001 Criar diretório `.github/skills/study-edital/` e arquivo `.github/skills/study-edital/__init__.py` vazio

**Checkpoint**: Estrutura de diretório criada — implementação pode começar.

---

## Fase 2: Fundação — Verificação de Pré-requisitos

**Objetivo**: Garantir que a spec 002 (Foundation) está disponível e os diretórios de entrada existem. Sem esta verificação, nenhuma operação de leitura de PDF pode ser tentada com segurança.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem verificar que `/input/editais/` e `/data/editais_md/` existem (criados pela spec 002).

- [ ] T002 Implementar `verificar_prerequisitos()` em `.github/skills/study-edital/edital_service.py` — verifica que `/input/editais/` e `/data/editais_md/` existem (criados por spec 002); lança erro em PT-BR se ausentes, orientando o usuário a executar a spec 002 primeiro

**Checkpoint**: Verificação de pré-requisitos completa — histórias de usuário podem começar com segurança.

---

## Fase 3: História de Usuário 1 — Conversão Automática de Edital para Markdown (Prioridade: P1) 🎯 MVP

**Objetivo**: Sistema converte PDFs de editais de `/input/editais/` para Markdown, detecta reprocessamento pelo hash SHA-256 e persiste em `/data/editais_md/`.

**Teste Independente**: Colocar um PDF de edital em `/input/editais/`, invocar conversão e verificar que arquivo `.md` é gerado em `/data/editais_md/` com conteúdo textual preservado.

- [ ] T003 [P] Implementar `detectar_pdf_editais(diretorio_entrada)` em `.github/skills/study-edital/pdf_converter.py` — lista PDFs em `/input/editais/`; retorna lista de caminhos absolutos (FR-001)
- [ ] T004 [P] Implementar `calcular_hash(caminho_pdf)` em `.github/skills/study-edital/pdf_converter.py` — retorna SHA-256 do arquivo via `hashlib` para detecção de reprocessamento (FR-001)
- [ ] T005 Implementar `converter_para_markdown(caminho_pdf, diretorio_saida)` em `.github/skills/study-edital/pdf_converter.py` — converte PDF para `.md` via MarkItDown (Padrão Facade — interface simples sobre MarkItDown); verifica PDF com texto extraível; registra log via Foundation (FR-001, FR-002)
- [ ] T006 Implementar lógica de detecção de reprocessamento em `converter_para_markdown()` — verifica se `.md` já existe para o mesmo hash; pergunta ao usuário "Reconverter ou reutilizar?" via `confirmation.py` da spec 002 (FR-001, US1 cenário 3)

**Checkpoint**: Padrão Facade completo — dado PDF em `/input/editais/`, `pdf_converter.py` gera Markdown em `/data/editais_md/` e registra log de sucesso sem expor MarkItDown ao restante do código.

---

## Fase 4: História de Usuário 2 — Extração Estruturada de Dados do Edital (Prioridade: P2)

**Objetivo**: Sistema extrai conteúdo programático, banca, cargos e distribuição de vagas do Markdown do edital, persistindo em `/data/edital_parsed.json`.

**Teste Independente**: Com Markdown de edital real em `/data/editais_md/`, invocar extração e verificar que `/data/edital_parsed.json` contém conteúdo programático estruturado com matérias e tópicos.

- [ ] T007 [P] Implementar `EstrategiaConteudoProgramatico` em `.github/skills/study-edital/extraction_strategies.py` — detecta e extrai seção de conteúdo programático (patterns: "CONTEÚDO PROGRAMÁTICO", "PROGRAMA DE PROVAS", "CONHECIMENTOS") com lista de matérias e tópicos (Padrão Strategy) (FR-004)
- [ ] T008 [P] Implementar `EstrategiaBancaECargo` em `.github/skills/study-edital/extraction_strategies.py` — extrai banca organizadora, cargo, número de vagas e data da prova do edital (Padrão Strategy) (FR-004)
- [ ] T009 [P] Implementar `EstrategiaDistribuicaoVagas` em `.github/skills/study-edital/extraction_strategies.py` — extrai distribuição de vagas por localidade/cargo quando presente (Padrão Strategy, fallback opcional) (FR-004)
- [ ] T010 Implementar `extrair(markdown_edital, estrategias)` em `.github/skills/study-edital/edital_extractor.py` — aplica lista de estratégias em sequência (Padrão Chain of Responsibility — cada estratégia tenta extrair; passa para a próxima se não encontrar padrão); agrega resultados num único dict (FR-004, FR-005)
- [ ] T011 Implementar validação de resultado mínimo em `extrair()` — verifica que ao menos conteúdo programático foi extraído; informa ao usuário em PT-BR quais seções não foram encontradas (FR-005)

**Checkpoint**: Padrão Chain of Responsibility + Strategy completo — `edital_extractor.py` aplica estratégias em sequência e agrega resultados; novo padrão de edital = nova estratégia sem alterar código existente.

---

## Fase 5: História de Usuário 3 — Consulta de Dados do Edital (Prioridade: P3)

**Objetivo**: Dados extraídos são persistidos em `/data/edital_parsed.json` e consultáveis pelas specs downstream (005 relevância usa edital como referência primária).

**Teste Independente**: Com extração concluída, invocar `buscar_materia("Direito Constitucional")` e verificar que retorna tópicos correspondentes do conteúdo programático.

- [ ] T012 Implementar `salvar_edital_parsed(dados_extraidos, workspace_dir)` em `.github/skills/study-edital/edital_repository.py` — persiste dict em `/data/edital_parsed.json` seguindo contrato de dados da spec 002 (campos `meta` + `data`); usa `confirmar_sobrescrita()` antes de sobrescrever (Padrão Repository) (FR-006, FR-007)
- [ ] T013 Implementar `carregar_edital_parsed(workspace_dir)` em `.github/skills/study-edital/edital_repository.py` — lê e retorna `/data/edital_parsed.json`; retorna `None` quando arquivo não existe (sem erro) (FR-006)
- [ ] T014 Implementar `buscar_materia(nome_materia, edital_data)` em `.github/skills/study-edital/edital_service.py` — busca matéria por correspondência parcial no conteúdo programático; retorna lista de tópicos ou lista vazia (FR-008)
- [ ] T015 Implementar `listar_materias(edital_data)` em `.github/skills/study-edital/edital_service.py` — retorna lista de todas as matérias presentes no conteúdo programático (FR-008)
- [ ] T016 Implementar `orquestrar_processamento_edital(workspace_dir)` em `.github/skills/study-edital/edital_service.py` — chama verificar_prerequisitos → detectar_pdf_editais → converter_para_markdown → extrair → salvar_edital_parsed; registra cada etapa via Foundation (FR-009, FR-010)

**Checkpoint**: Padrão Repository + Service Layer completo — `edital_service.py` orquestra o pipeline de ponta a ponta; `edital_repository.py` isola toda persistência. Spec 005 pode consumir `edital_parsed.json` como referência primária de classificação.

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos extremos.

- [ ] T017 [P] Revisar todas as mensagens ao usuário em `.github/skills/study-edital/` — garantir 100% em PT-BR
- [ ] T018 [P] Adicionar tratamento de PDF sem texto extraível (protegido, escaneado) em `pdf_converter.py` — informar usuário com mensagem clara em PT-BR (US1 cenário 2)
- [ ] T019 Validar todos os cenários de teste de `specs/003-study-edital-processing/quickstart.md` — executar manualmente com edital real

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — BLOQUEIA todas as histórias
- **US1 (Fase 3)**: Depende da Fundação; depende de 002-study-foundation instalada
- **US2 (Fase 4)**: Depende de US1 — precisa do Markdown gerado para extrair dados
- **US3 (Fase 5)**: Depende de US2 — persiste e consulta o que US2 extraiu
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada**: 002-study-foundation (obrigatória — memória, logging, contratos, confirmação)
- **Saída para**: 005-study-relevance-engine (opcional — `edital_parsed.json` enriquece classificação)

### Oportunidades de Paralelismo

- T003 e T004 (US1): funções independentes no mesmo arquivo
- T007, T008 e T009 (US2): três estratégias diferentes, sem dependência entre si

---

## Estratégia de Implementação

### MVP Primeiro (Apenas US1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação
3. Completar Fase 3: US1 (Conversão de PDF)
4. **PARAR e VALIDAR**: edital convertido para Markdown com log registrado
5. Continuar US2 → US3

### Entrega Incremental

1. Setup + Fundação → verificação de ambiente pronta
2. US1 (Conversão) → Markdown do edital disponível
3. US2 (Extração) → `edital_parsed.json` com conteúdo programático estruturado
4. US3 (Consulta + Persistência) → spec 005 pode consumir dados do edital

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- Esta spec é **opcional** no pipeline — se o edital não estiver disponível, spec 005 opera com inferência do modelo
- **Princípio IX**: Cada estratégia em `extraction_strategies.py` tem responsabilidade única — um padrão de extração por classe; dividir estratégia ampla em múltiplas classes menores
