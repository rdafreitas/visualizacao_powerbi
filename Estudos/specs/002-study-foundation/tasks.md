# Tarefas: Study Foundation

**Entrada**: Documentos de design em `/specs/002-study-foundation/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/data_contracts.md

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar a estrutura de diretório antes de qualquer implementação.

- [ ] T001 Criar diretório `.github/skills/study-foundation/` e arquivo `.github/skills/study-foundation/__init__.py` vazio

**Checkpoint**: Estrutura criada — implementação pode começar.

---

## Fase 2: Fundação — Contratos de Dados e Diretórios do Workspace

**Objetivo**: Criar `data_contracts.py` com validação de schema e criação automática de diretórios. Implementa o princípio **Fail Fast** — o sistema verifica o ambiente antes de operar, nunca no meio de uma execução.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem os diretórios do workspace e os contratos de dados definidos.

- [ ] T002 [P] Implementar `criar_diretorios_workspace(workspace_dir)` em `.github/skills/study-foundation/data_contracts.py` — cria `/data/`, `/logs/`, `/input/editais/`, `/Histórico Anotações/Resumo/`, `/Histórico Anotações/Questões/` quando não existirem (FR-015)
- [ ] T003 [P] Implementar `criar_contrato_meta(materia, banca, source_file, source_hash, version)` em `.github/skills/study-foundation/data_contracts.py` — retorna dict com campos `meta` obrigatórios: materia, banca, created_at, updated_at, source_file, source_hash, version (FR-013)
- [ ] T004 Implementar `validar_contrato(json_data)` em `.github/skills/study-foundation/data_contracts.py` — verifica presença obrigatória de campos `meta` e `data`; lança `ValueError` com mensagem em PT-BR se inválido (FR-013)

**Checkpoint**: Padrão Fail Fast completo — `data_contracts.py` cria diretórios e valida schema de qualquer JSON em `/data/`. Histórias de usuário podem começar.

---

## Fase 3: História de Usuário 1 — Memória Persistente e Retomada (Prioridade: P1) 🎯 MVP

**Objetivo**: Sistema persiste progresso em `study-memory.json` e detecta sessões anteriores pelo hash SHA-256 do PDF, oferecendo retomada do ponto de interrupção.

**Teste Independente**: Executar pipeline até fase 3, interromper, reinvocar com mesmo PDF. Verificar que o sistema informa "Progresso encontrado: fases 0–3 concluídas" e pergunta "Retomar da fase 4 ou recomeçar?".

- [ ] T005 Implementar `inicializar(workspace_dir)` em `.github/skills/study-foundation/memory_manager.py` — cria `study-memory.json` com estrutura default `{"version": "1.0", "sessions": {}, "preferences": {}, "history": []}` quando não existir (FR-001, FR-005)
- [ ] T006 Implementar `carregar(workspace_dir)` em `.github/skills/study-foundation/memory_manager.py` — lê `study-memory.json` uma única vez e retorna dict em memória (Padrão Singleton — uma única leitura por execução) (FR-001)
- [ ] T007 [P] Implementar `calcular_hash_pdf(caminho_pdf)` em `.github/skills/study-foundation/memory_manager.py` — retorna SHA-256 do arquivo usando `hashlib.sha256` (FR-001)
- [ ] T008 [P] Implementar `detectar_progresso(pdf_hash, memoria)` em `.github/skills/study-foundation/memory_manager.py` — busca sessão pelo hash; retorna `{"fase_atual": N, "fases_concluidas": [...], "variaveis": {...}}` ou `None` quando não encontrado (FR-002)
- [ ] T009 Implementar `registrar_fase_concluida(fase, pdf_hash, variaveis_intermediarias, memoria)` em `.github/skills/study-foundation/memory_manager.py` — atualiza entrada de sessão com fase concluída e paths de artefatos intermediários (FR-001, FR-003, FR-004)
- [ ] T010 Implementar `salvar(workspace_dir, memoria)` em `.github/skills/study-foundation/memory_manager.py` — escrita atômica via arquivo `.tmp` + rename para evitar corrupção do `study-memory.json` (FR-001)
- [ ] T011 Implementar `migrar_schema(dados, versao_atual)` em `.github/skills/study-foundation/memory_manager.py` — aplica transformações sequenciais versão por versão (Padrão Schema Migration); preserva todos os dados existentes (FR-005)

**Checkpoint**: Padrão Singleton + Schema Migration completo — pipeline interrompido e reiniciado com mesmo PDF oferece retomada correta (SC-001).

---

## Fase 4: História de Usuário 2 — Logging Estruturado (Prioridade: P2)

**Objetivo**: Sistema registra eventos estruturados em `/logs/execution_log.json` com 5 níveis, campos obrigatórios e rotação automática ao atingir 10.000 entradas.

**Teste Independente**: Executar qualquer fase do pipeline e verificar que `/logs/execution_log.json` contém entrada com campos: id, timestamp, phase, level, event.

- [ ] T012 [P] Implementar constantes de nível `DEBUG`, `INFO`, `DECISION`, `WARNING`, `ERROR` como strings em `.github/skills/study-foundation/logger.py` (FR-007)
- [ ] T013 Implementar `log(level, event, data, phase, workspace_dir)` em `.github/skills/study-foundation/logger.py` — cria entrada com id (UUID4), timestamp ISO-8601, phase, level, event, input, output, decision, sources; appenda em `/logs/execution_log.json` (Padrão Observer Simplificado — chamadores não sabem como o log é armazenado) (FR-006)
- [ ] T014 Implementar `rotacionar_se_necessario(workspace_dir)` em `.github/skills/study-foundation/logger.py` — conta entradas; move para `execution_log_<YYYY-MM-DDTHH-MM-SS>.json` e inicia arquivo vazio ao atingir 10.000 entradas (FR-008)

**Checkpoint**: Padrão Observer Simplificado completo — qualquer módulo que chama `log()` gera entrada válida sem conhecer detalhes de persistência (SC-002).

---

## Fase 5: História de Usuário 3 — Modo Debug (Prioridade: P3)

**Objetivo**: Flag `--debug` ativa exibição em tempo real de decisões do agente no chat sem alterar o fluxo do pipeline.

**Teste Independente**: Executar pipeline com `--debug` e verificar que decisões DECISION aparecem no chat; executar sem `--debug` e verificar que apenas WARNING/ERROR são exibidos.

- [ ] T015 Implementar `exibir_para_usuario(entry, debug_mode)` em `.github/skills/study-foundation/logger.py` — modo normal: exibe apenas WARNING/ERROR; modo debug: exibe também DEBUG e DECISION com contexto completo (FR-009, FR-010)
- [ ] T016 Adicionar persistência de `debug_mode` em `memory.preferences.debug_mode` dentro de `inicializar()` em `.github/skills/study-foundation/memory_manager.py` — preserva preferência entre sessões (FR-003, FR-009)

**Checkpoint**: Modo debug completo — `--debug` exibe decisões em tempo real sem alterar resultado do pipeline (SC-003).

---

## Fase 6: História de Usuário 4 — Confirmação de Ações Destrutivas (Prioridade: P4)

**Objetivo**: Sistema solicita confirmação explícita antes de sobrescrever arquivos ou publicar externamente (Constitution II). Integra todos os módulos anteriores em pipeline coeso via Template Method.

**Teste Independente**: Tentar sobrescrever `/data/topicos.json` existente e verificar que o sistema exibe "Arquivo já existe" e aguarda confirmação antes de prosseguir.

- [ ] T017 [P] Implementar `confirmar_sobrescrita(caminho_arquivo)` em `.github/skills/study-foundation/confirmation.py` — verifica se arquivo existe; exibe mensagem PT-BR com caminho e aguarda "s/n" (FR-011)
- [ ] T018 [P] Implementar `confirmar_acao(mensagem, detalhes)` em `.github/skills/study-foundation/confirmation.py` — exibe mensagem de confirmação genérica com detalhes e aguarda resposta explícita "s" ou "n" (FR-011)
- [ ] T019 Implementar `confirmar_reprocessamento(artefato, hash_atual, hash_esperado)` em `.github/skills/study-foundation/confirmation.py` — compara hashes; oferece três opções em PT-BR: reutilizar, reprocessar ou cancelar (FR-012)
- [ ] T020 Implementar `executar_fase(numero_fase, descricao, funcao_fase, pdf_hash, memoria, workspace_dir)` em `.github/skills/study-foundation/state_machine.py` — esqueleto Template Method: (1) verifica estado em `memoria`, (2) executa `funcao_fase`, (3) chama `registrar_fase_concluida`, (4) chama `log` automaticamente (FR-001, FR-006)
- [ ] T021 Integrar chamada a `confirmar_sobrescrita()` dentro de `executar_fase()` em `.github/skills/study-foundation/state_machine.py` — verifica artefatos existentes antes de executar cada fase (FR-011)

**Checkpoint**: Padrão Template Method completo — `state_machine.py` integra memory_manager, logger e confirmation num esqueleto reutilizável por todas as specs downstream. 0% de ações destrutivas sem confirmação (SC-004).

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos extremos.

- [ ] T022 [P] Revisar todas as mensagens de erro e informação em `.github/skills/study-foundation/` — garantir 100% em PT-BR (FR-014, SC-005)
- [ ] T023 [P] Adicionar tratamento de `study-memory.json` corrompido em `.github/skills/study-foundation/memory_manager.py` — fazer backup do arquivo corrompido antes de recriar (edge case da spec)
- [ ] T024 Validar todos os cenários de teste de `specs/002-study-foundation/quickstart.md` — executar manualmente e verificar SC-001 a SC-006

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências — pode começar imediatamente
- **Fundação (Fase 2)**: Depende de Fase 1 — BLOQUEIA todas as histórias
- **US1 (Fase 3)**: Depende da Fundação
- **US2 (Fase 4)**: Depende da Fundação; usa mesmos arquivos que US1 (sem conflito)
- **US3 (Fase 5)**: Depende de US2 — estende `logger.py`
- **US4 (Fase 6)**: Depende de US1 + US2 + US3 — `state_machine.py` integra tudo
- **Polimento (Fase Final)**: Depende de todas as histórias

### Dependências com Outras Specs

- **Nenhuma dependência de entrada** — esta é a primeira spec a ser implementada
- **É pré-requisito bloqueante** de todas as demais (003, 004, 005, 006, 007)

### Oportunidades de Paralelismo

- T002 e T003 (Fundação): funções distintas no mesmo arquivo
- T007 e T008 (US1): funções sem dependência mútua
- T012 (US2): pode ser feita em paralelo com início de T013
- T017 e T018 (US4): funções independentes no mesmo arquivo

---

## Estratégia de Implementação

### MVP Primeiro (Apenas US1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (CRÍTICO — bloqueia tudo)
3. Completar Fase 3: US1 (Memória Persistente)
4. **PARAR e VALIDAR**: pipeline interrompido retoma corretamente
5. Continuar US2 → US3 → US4 em sequência

### Entrega Incremental

1. Setup + Fundação → Fail Fast e contratos de dados prontos
2. US1 (Memória) → retomada de pipeline funcional (valor imediato)
3. US2 (Logging) → observabilidade básica
4. US3 (Debug) → observabilidade avançada
5. US4 (Confirmação + State Machine) → infraestrutura completa integrada

---

## Notas

- Tarefas [P] = funções ou arquivos distintos, sem dependências entre si naquela fase
- O rótulo [US?] mapeia a tarefa a uma história de usuário para rastreabilidade
- Esta spec não tem dependências externas — pode ser implementada isoladamente
- **Princípio IX**: `state_machine.py` (Fase 6) só deve ser implementado após US1 + US2 + US3 estarem estáveis — ele integra tudo e nomeia o Padrão Template Method explicitamente no checkpoint
