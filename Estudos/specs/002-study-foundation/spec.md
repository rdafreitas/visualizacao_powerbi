# Feature Specification: Study Foundation

**Feature Branch**: `002-study-foundation`
**Created**: 2026-04-13
**Status**: Draft
**Role**: Foundation (bloqueante para todas as demais specs)
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**: Nenhuma (primeira spec a ser implementada)

---

## Escopo

Infraestrutura transversal compartilhada por todas as feature specs do Study Concurso Agent:
- Memória persistente com versionamento e retomada
- Logging estruturado com rotação
- Modo debug
- Contratos de dados JSON para `/data/`
- Confirmação de ações destrutivas
- Comunicação PT-BR
- Detecção de reprocessamento

## Rationale

Os princípios constitucionais III (Pipeline Sequencial), IV (Dados como Verdade), VII (Observabilidade) e II (Confirmação) exigem que contratos de infraestrutura existam antes de qualquer feature funcionar. Sem esta spec, cada feature reimplementaria memória, logging e validação independentemente, violando DRY e Constitution VI.

---

## User Scenarios & Testing

### User Story 1 — Memória Persistente e Retomada (Priority: P1)

O sistema persiste o progresso de cada execução do pipeline em memória local (`study-memory.json`), identificando cada PDF por hash. Quando o usuário reinvoca o pipeline para um PDF já parcialmente processado, o sistema detecta o progresso anterior e oferece retomada.

**Why this priority**: Sem memória, toda interrupção obriga reprocessamento completo. É a base para todas as fases do pipeline — Constitution III exige retomada.

**Independent Test**: Executar pipeline até fase 3, interromper, reinvocar com mesmo PDF. Verificar que o sistema oferece retomar da fase 4.

**Acceptance Scenarios**:

1. **Given** um PDF sendo processado pela primeira vez, **When** a fase 2 é concluída, **Then** o sistema salva em `study-memory.json` o hash do PDF, fase atual (2), fases concluídas ([0,1,2]) e variáveis intermediárias (paths dos artefatos).
2. **Given** `study-memory.json` com progresso para um PDF (fase 3 concluída), **When** o usuário reinvoca o pipeline com o mesmo PDF, **Then** o sistema detecta pelo hash, informa "Progresso encontrado: fases 0–3 concluídas" e pergunta "Retomar da fase 4 ou recomeçar?".
3. **Given** o usuário escolhe "recomeçar", **When** o sistema reinicia o pipeline, **Then** solicita confirmação antes de sobrescrever o progresso anterior e os artefatos intermediários existentes.
4. **Given** `study-memory.json` não existe, **When** o sistema é invocado pela primeira vez, **Then** cria o arquivo com estrutura versionada e valores padrão.

---

### User Story 2 — Logging Estruturado (Priority: P2)

Toda fase do pipeline registra logs estruturados em `/logs/execution_log.json`, incluindo entradas, saídas, decisões e erros. O log é consultável e rotacionável.

**Why this priority**: Constitution VII exige auditabilidade. Sem logging, é impossível diagnosticar falhas ou auditar decisões do agente.

**Independent Test**: Executar qualquer fase do pipeline e verificar que `/logs/execution_log.json` contém entrada com timestamp, fase, inputs e outputs.

**Acceptance Scenarios**:

1. **Given** o início de uma fase do pipeline, **When** a fase é iniciada, **Then** o sistema registra entrada com campos: id (UUID), timestamp, phase, level ("INFO"), event ("phase_start"), input (resumo das entradas).
2. **Given** uma fase concluída com sucesso, **When** a fase termina, **Then** o sistema registra entrada com event ("phase_end"), output (resumo das saídas), status ("success").
3. **Given** um erro durante a execução, **When** a exceção é capturada, **Then** o sistema registra entrada com level ("ERROR"), mensagem de erro e contexto suficiente para diagnóstico.
4. **Given** o log atingiu 10.000 entradas, **When** uma nova entrada é adicionada, **Then** o arquivo atual é rotacionado para `execution_log_<timestamp>.json` e um novo log vazio é iniciado.

---

### User Story 3 — Modo Debug (Priority: P3)

O usuário pode ativar modo debug (`--debug`) que exibe decisões intermediárias do agente em tempo real no chat, sem alterar funcionalidade do pipeline.

**Why this priority**: Essencial para troubleshooting e confiança. Não bloqueia outras features mas intensifica observabilidade.

**Independent Test**: Executar pipeline com `--debug` ativo e verificar que decisões intermediárias (ex: "Classificando tópico X como 🔥 porque...") aparecem no chat.

**Acceptance Scenarios**:

1. **Given** modo debug ativo, **When** o agente toma uma decisão (classificação, parsing, formatação), **Then** exibe no chat: contexto da decisão, input usado, output gerado e fontes consultadas.
2. **Given** modo debug ativo, **When** dados JSON serão publicados (Google Docs ou Anki), **Then** exibe preview dos dados antes de publicar e aguarda confirmação.
3. **Given** modo debug inativo (padrão), **When** o pipeline executa normalmente, **Then** apenas warnings e erros são exibidos ao usuário; decisões intermediárias são registradas apenas no log.
4. **Given** o usuário altera a preferência de debug, **When** executa `--debug` ou `--no-debug`, **Then** a preferência é persistida em `study-memory.json` → `preferences.debug_mode`.

---

### User Story 4 — Confirmação de Ações Destrutivas (Priority: P4)

O sistema solicita confirmação explícita do usuário antes de qualquer ação que sobrescreva, delete ou publique dados externamente.

**Why this priority**: Constitution II é não-negociável. Garante segurança dos dados do usuário.

**Independent Test**: Tentar sobrescrever um arquivo existente em `/data/` e verificar que o sistema pede confirmação antes de prosseguir.

**Acceptance Scenarios**:

1. **Given** um arquivo em `/data/topicos.json` já existe, **When** o pipeline tenta salvá-lo novamente, **Then** o sistema informa "Arquivo já existe" e pergunta "Sobrescrever?".
2. **Given** o pipeline vai publicar em Google Docs, **When** a fase de publicação é atingida, **Then** o sistema solicita confirmação antes de criar/atualizar o documento.
3. **Given** o pipeline vai enviar cards ao Anki, **When** a fase de Anki é atingida, **Then** o sistema solicita confirmação, mostrando quantidade de cards e deck destino.

---

### Edge Cases

- O que acontece quando `study-memory.json` está corrompido? O sistema deve fazer backup do arquivo corrompido, criar novo e informar ao usuário.
- O que acontece quando `/logs/` não existe? O sistema deve criar o diretório automaticamente.
- O que acontece quando o hash do PDF muda (arquivo editado)? O sistema deve tratar como novo PDF e informar ao usuário.
- O que acontece quando o schema de `study-memory.json` é de versão antiga? O sistema deve migrar automaticamente e informar ao usuário.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE persistir progresso de execução em `study-memory.json` na raiz do workspace, identificando cada PDF por hash SHA-256 do arquivo.
- **FR-002**: O sistema DEVE detectar progresso anterior para o mesmo PDF (por hash) e oferecer retomada da próxima fase não concluída.
- **FR-003**: O sistema DEVE salvar preferências do usuário (banca padrão, deck padrão, modo debug, diretório de output) em `study-memory.json` → `preferences`.
- **FR-004**: O sistema DEVE manter histórico de classificações anteriores em `study-memory.json` → `history` em modo append-only.
- **FR-005**: O sistema DEVE versionar a estrutura de `study-memory.json` com campo `version` e realizar migração automática quando a versão atual for superior à do arquivo existente.
- **FR-006**: O sistema DEVE registrar logs estruturados em `/logs/execution_log.json` com campos: id, timestamp, phase, level, event, input, output, decision, sources.
- **FR-007**: O sistema DEVE suportar 5 níveis de log: DEBUG, INFO, DECISION, WARNING, ERROR.
- **FR-008**: O sistema DEVE rotacionar o log para `execution_log_<timestamp>.json` ao atingir 10.000 entradas.
- **FR-009**: O sistema DEVE suportar flag `--debug` que ativa exibição em tempo real de logs de nível DEBUG e DECISION no chat.
- **FR-010**: Em modo normal (sem debug), o sistema DEVE exibir ao usuário apenas mensagens de nível WARNING e ERROR; demais são registrados silenciosamente.
- **FR-011**: O sistema DEVE solicitar confirmação do usuário antes de: sobrescrever arquivos existentes, publicar em Google Docs, enviar cards ao Anki, substituir memória persistida.
- **FR-012**: O sistema DEVE perguntar ao usuário se deseja reprocessar ou reutilizar quando artefatos intermediários em `/data/` já existem para o mesmo material (detectado por hash no campo `meta.source_hash`).
- **FR-013**: O sistema DEVE definir contratos de dados para todos os JSONs em `/data/`, com estrutura padrão: campo `meta` (materia, banca, created_at, updated_at, source_file, source_hash, version) + campo `data` (conteúdo específico).
- **FR-014**: O sistema DEVE comunicar-se com o usuário integralmente em português brasileiro (PT-BR).
- **FR-015**: O sistema DEVE criar automaticamente diretórios (`/data/`, `/logs/`, `/input/editais/`, `/Histórico Anotações/Resumo/`, `/Histórico Anotações/Questões/`) quando não existirem.

### Key Entities

- **Sessão de Processamento**: Registro de execução do pipeline. Atributos: PDF de origem (hash), fase atual, fases concluídas, variáveis intermediárias, timestamps de início e atualização.
- **Preferência do Usuário**: Configuração persistida. Atributos: banca padrão, deck padrão Anki, modo debug, diretório de output, nível RAG.
- **Entrada de Log**: Registro de evento. Atributos: UUID, timestamp, fase, nível, evento, input, output, decisão, fontes.
- **Contrato de Dados JSON**: Estrutura padrão para `/data/*.json`. Atributos: meta (matéria, banca, timestamps, source_hash, version), data (conteúdo variável).

## Success Criteria

### Measurable Outcomes

- **SC-001**: O pipeline interrompido em qualquer fase pode ser retomado com sucesso a partir da última fase concluída em 100% dos casos.
- **SC-002**: 100% das fases executadas geram pelo menos uma entrada de log em `/logs/execution_log.json`.
- **SC-003**: Toda decisão do agente em modo debug é visível em tempo real no chat sem alterar o resultado do processamento.
- **SC-004**: 0% de ações destrutivas ocorrem sem confirmação explícita do usuário.
- **SC-005**: Toda comunicação com o usuário é em PT-BR.
- **SC-006**: A migração de schema de `study-memory.json` entre versões ocorre sem perda de dados em 100% dos casos.

## Assumptions

- O filesystem local tem permissões de leitura/escrita nos diretórios do workspace.
- O ambiente de execução é Windows com Python 3.11+.
- `study-memory.json` e `/logs/` são locais ao workspace (não remotos).
- O tamanho de `study-memory.json` não excederá capacidade razoável (< 10MB) para uso single-user.
