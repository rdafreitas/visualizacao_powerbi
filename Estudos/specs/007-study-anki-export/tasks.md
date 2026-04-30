# Tarefas: Study Anki Export

**Entrada**: Documentos de design em `/specs/007-study-anki-export/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/ankiconnect.md
**Dependências obrigatórias**: 002-study-foundation, 004-study-summary-generation, 005-study-relevance-engine.

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar a estrutura de arquivos da skill antes de qualquer implementação.

- [ ] T001 Criar diretório `.github/skills/study-anki/` — o arquivo `send_to_anki.py` existente deve ser mantido sem alterações (Princípio VIII — backward compatibility)

**Checkpoint**: Estrutura criada sem alterar `send_to_anki.py` existente.

---

## Fase 2: Fundação — Adapter AnkiConnect e Repository de Dados

**Objetivo**: Criar `anki_connector.py` (comunicação HTTP com AnkiConnect) e `anki_repository.py` (leitura de dados locais). Sem estes dois módulos, nenhuma lógica de negócio pode ser testada — o Adapter isola a API e o Repository isola os arquivos JSON.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem a fundação — o Adapter e o Repository são os únicos pontos de comunicação com o mundo externo.

- [ ] T002 [P] Implementar `verificar_conectividade(porta) -> bool` em `.github/skills/study-anki/anki_connector.py` — tenta `urllib.request` para `http://localhost:{porta}/` com timeout de 5s; retorna `True` se AnkiConnect responde, `False` sem lançar exceção (Padrão Adapter + Tratamento Defensivo de Erros) (FR-001)
- [ ] T003 [P] Implementar `_request(action, params) -> dict` em `.github/skills/study-anki/anki_connector.py` — envia JSON `{"action": action, "version": 6, "params": params}` via `urllib.request.urlopen`; retorna resultado; lança exceção com mensagem PT-BR se campo `error` presente (Padrão Adapter — traduz chamadas de alto nível para JSON AnkiConnect) (plan.md Adapter)
- [ ] T004 [P] Implementar `listar_decks() -> list` em `.github/skills/study-anki/anki_connector.py` — chama `_request("deckNames", {})`; retorna lista de nomes de decks (FR-002)
- [ ] T005 [P] Implementar `listar_decks_com_contagem() -> dict` em `.github/skills/study-anki/anki_connector.py` — chama `_request("deckNamesAndIds", {})`; para cada deck chama `_request("findCards", {...})`; retorna dict `{nome: contagem}` (FR-002)
- [ ] T006 [P] Implementar `carregar_topicos(workspace_dir) -> list` em `.github/skills/study-anki/anki_repository.py` — lê e valida `/data/topicos.json`; retorna lista de tópicos Python (Padrão Repository) (FR-005)
- [ ] T007 [P] Implementar `carregar_relevancia(workspace_dir) -> dict | None` em `.github/skills/study-anki/anki_repository.py` — lê `/data/relevancia_topicos.json` se existir; retorna dict indexado por `id_topico`; retorna `None` sem erro quando ausente (FR-006)

**Checkpoint**: Padrão Adapter + Repository completo — `anki_connector.py` isola toda comunicação HTTP com AnkiConnect; `anki_repository.py` isola toda leitura de arquivos JSON. Lógica de negócio pode começar.

---

## Fase 3: História de Usuário 1 — Listagem e Recomendação de Deck (Prioridade: P1) 🎯 MVP

**Objetivo**: Sistema lista decks existentes no Anki Desktop, recomenda o deck mais adequado para a matéria e permite que o usuário confirme ou escolha outro deck.

**Teste Independente**: Com Anki Desktop aberto e AnkiConnect ativo, invocar listagem e verificar que os decks são exibidos com nome e contagem de cards.

- [ ] T008 [P] Implementar `recomendar_deck(decks_existentes, materia) -> str | None` em `.github/skills/study-anki/deck_service.py` — busca match parcial entre nome do deck e `materia` (case-insensitive); retorna nome do deck com maior correspondência ou `None` se não encontrado (Padrão Service Layer — regra de negócio isolada) (FR-003)
- [ ] T009 [P] Implementar `gerar_nome_novo_deck(materia) -> str` em `.github/skills/study-anki/deck_service.py` — retorna nome no formato `Concurso::<Matéria>` com capitalização correta (FR-004)
- [ ] T010 Implementar `selecionar_deck(materia, workspace_dir) -> str` em `.github/skills/study-anki/deck_service.py` — (1) verifica conectividade via Adapter, (2) lista decks com contagem, (3) exibe lista ao usuário em PT-BR, (4) chama `recomendar_deck` e exibe recomendação, (5) aguarda escolha do usuário; se nenhum deck corresponde, oferece criar novo via `confirmar_acao()` da spec 002 e chama `_request("createDeck", ...)` (FR-002, FR-003, FR-004)

**Checkpoint**: Padrão Service Layer completo — `deck_service.py` contém toda regra de negócio de seleção de deck; sem IO de arquivo, sem HTTP direto. Com Anki aberto, `selecionar_deck()` lista decks e retorna deck escolhido.

---

## Fase 4: História de Usuário 2 — Exportação Batch de Flashcards (Prioridade: P2)

**Objetivo**: Tópicos classificados são transformados em flashcards (frente = L0, verso = L1+L2) e enviados ao Anki em batch com tags de matéria e relevância.

**Teste Independente**: Com deck selecionado, `topicos.json` e `relevancia_topicos.json` existentes, invocar exportação e verificar que flashcards são criados no Anki com tags corretas.

- [ ] T011 [P] Implementar `montar_flashcard(topico, relevancia_dict, materia) -> dict` em `.github/skills/study-anki/flashcard_service.py` — constrói flashcard: frente = texto L0 (truncado em 200 chars com "..." se necessário), verso = textos L1+L2 concatenados, tags = [`materia::<nome>`, `relevancia::<alta|media|baixa>`] quando relevância disponível, senão apenas `materia::<nome>` (Padrão Service Layer) (FR-005, FR-006)
- [ ] T012 Implementar `montar_batch(topicos, relevancia_dict, materia) -> list` em `.github/skills/study-anki/flashcard_service.py` — aplica `montar_flashcard` a cada tópico L0; retorna lista de dicts no formato `{"deckName": ..., "modelName": "Basic", "fields": {"Front": ..., "Back": ...}, "tags": [...]}` (FR-005, FR-007)
- [ ] T013 Implementar `enviar_batch(flashcards, deck_nome) -> dict` em `.github/skills/study-anki/anki_connector.py` — chama `_request("addNotes", {"notes": flashcards})`; retorna resultado com lista de IDs criados e IDs `null` (duplicatas) (FR-007, FR-008)
- [ ] T014 Implementar `detectar_duplicatas(resultado_envio) -> dict` em `.github/skills/study-anki/anki_connector.py` — identifica entradas `null` no resultado (flashcard duplicado detectado pelo Anki); retorna `{"enviados": N, "sucesso": M, "duplicatas": K, "erros": E}` (FR-008, FR-010)
- [ ] T015 Implementar `exportar_flashcards(workspace_dir, materia, deck_nome, debug_mode)` em `.github/skills/study-anki/anki_export.py` — fluxo completo: (1) Repository lê dados, (2) `montar_batch`, (3) exibe contagem e distribuição por relevância, (4) `confirmar_acao()` via Foundation, (5) `enviar_batch`, (6) `detectar_duplicatas`, (7) exibe relatório PT-BR (total/sucesso/erro/duplicatas), (8) persiste `anki_result_<mat>_<dt>.json` via Foundation (FR-007, FR-008, FR-010, FR-011)

**Checkpoint**: Padrão Service Layer + Tratamento Defensivo de Erros completo — `flashcard_service.py` monta flashcards sem saber como serão enviados; `anki_export.py` orquestra o fluxo de ponta a ponta com confirmação e relatório final.

---

## Fase 5: História de Usuário 3 — Fallback sem AnkiConnect (Prioridade: P3)

**Objetivo**: Quando AnkiConnect não está disponível, sistema salva flashcards em arquivo importável pelo Anki (`/data/anki_export_<mat>_<dt>.txt`) e informa o usuário.

**Teste Independente**: Com porta 8765 indisponível (Anki fechado), invocar exportação e verificar que arquivo `.txt` tab-separated é gerado em `/data/` com frente, verso e tags de cada flashcard.

- [ ] T016 [P] Implementar `salvar_fallback(flashcards, materia, workspace_dir) -> str` em `.github/skills/study-anki/anki_export.py` — gera `/data/anki_export_<materia>_<YYYY-MM-DD>.txt` no formato tab-separated `frente\tverso\ttags`; retorna caminho do arquivo criado (FR-009)
- [ ] T017 Integrar decisão de fallback em `exportar_flashcards()` de `.github/skills/study-anki/anki_export.py` — chama `verificar_conectividade()` no início; quando retorna `False`, informa "AnkiConnect indisponível — Anki Desktop pode estar fechado", oferece fallback e chama `salvar_fallback()` (Tratamento Defensivo de Erros) (FR-001, FR-009)
- [ ] T018 Implementar detecção de arquivo de fallback pendente em `exportar_flashcards()` — quando AnkiConnect volta a ficar disponível e arquivo `.txt` existe em `/data/`, oferecer ao usuário opção de reenviar cards pendentes (US3 cenário 4) (FR-009)

**Checkpoint**: Padrão Tratamento Defensivo de Erros completo — 100% dos casos com AnkiConnect indisponível geram arquivo de fallback importável (SC-003). O usuário nunca perde trabalho por Anki estar fechado.

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos extremos.

- [ ] T019 [P] Revisar todas as mensagens ao usuário em `.github/skills/study-anki/` — garantir 100% em PT-BR
- [ ] T020 [P] Adicionar alerta quando deck recomendado tem muitos cards em `selecionar_deck()` — alertar sobre risco de poluição quando deck escolhido já tem mais de 500 cards de outra matéria (edge case da spec)
- [ ] T021 [P] Adicionar tratamento de tópico L0 muito longo em `montar_flashcard()` — truncar frente com "..." em 200 chars e colocar versão completa no campo `Back` (edge case da spec)
- [ ] T022 Validar todos os cenários de teste de `specs/007-study-anki-export/quickstart.md` — executar com Anki Desktop aberto e verificar SC-001 a SC-004

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — BLOQUEIA todas as histórias
- **US1 (Fase 3)**: Depende da Fundação (Adapter pronto para listar decks)
- **US2 (Fase 4)**: Depende de US1 (deck selecionado) + Fundação (Repository pronto)
- **US3 (Fase 5)**: Depende da Fundação (Adapter para verificar conectividade) + US2 (`exportar_flashcards()` existe)
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada obrigatória**: 002-study-foundation (memória, logging, confirmação); 004-study-summary-generation (`topicos.json`); 005-study-relevance-engine (`relevancia_topicos.json`)
- **Não altera**: `send_to_anki.py` existente (Princípio VIII — backward compatibility)
- **Saída**: Cards no Anki Desktop + `anki_result_*.json` + `anki_export_*.txt` (fallback)

### Oportunidades de Paralelismo

- T002, T003, T004, T005 (Fundação Adapter): funções independentes no mesmo arquivo
- T006 e T007 (Fundação Repository): dois arquivos distintos
- T008 e T009 (US1): funções independentes no deck_service
- T011 (US2) pode começar antes de T013 (dependência somente em T015)
- T016 e T018 (US3) têm dependência em T017 — implementar T017 primeiro

---

## Estratégia de Implementação

### MVP Primeiro (US1 + US2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (Adapter + Repository)
3. Completar Fase 3: US1 (Listagem e seleção de deck)
4. Completar Fase 4: US2 (Exportação batch)
5. **PARAR e VALIDAR**: flashcards enviados com tags corretas, relatório exibido
6. Adicionar US3 (Fallback) como incremento de resiliência

### Entrega Incremental

1. Setup + Fundação → AnkiConnect acessível, topicos.json legível
2. US1 (Deck) → seleção de deck funcional
3. US2 (Batch) → exportação completa com confirmação e relatório
4. US3 (Fallback) → resiliência quando Anki está fechado

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- **Princípio VIII**: `send_to_anki.py` existente NUNCA deve ser alterado — o novo `anki_export.py` é a feature de batch sem relação com o script de card único
- **Princípio IX**: `flashcard_service.py` contém APENAS regras de negócio — frente/verso/tags; não faz HTTP, não lê arquivos; se crescer, dividir em funções menores com responsabilidade única
- Sem `pip install` necessário — `urllib`, `json`, `pathlib`, `datetime` são stdlib do Python 3.11+
