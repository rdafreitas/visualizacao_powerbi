# Implementation Plan: Study Anki Export

**Branch**: `007-study-anki-export` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-study-anki-export/spec.md`

## Summary

Integração com Anki Desktop via AnkiConnect (API HTTP em `localhost:8765`) para exportação
em batch de flashcards gerados a partir de `topicos.json` (spec 004) com classificações de
relevância de `relevancia_topicos.json` (spec 005).

Cobre: listagem e recomendação de deck, montagem de flashcards (frente = L0, verso = L1+L2),
tags de matéria e relevância, detecção de duplicatas, e fallback offline quando AnkiConnect
indisponível.

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Adapter**, **Repository**, **Service Layer** e **Tratamento Defensivo de Erros**.
Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix)
abaixo — aprenda os nomes, pois você os encontrará em todo projeto Python.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: `urllib`, `json`, `pathlib`, `datetime` (todos stdlib — sem `pip install`)
**Storage**: JSON em `/data/` — leitura: `topicos.json`, `relevancia_topicos.json`;
escrita: `anki_export_<mat>_<dt>.txt` (fallback) + `anki_result_<mat>_<dt>.json` (resultado)
**Testing**: Manual — Anki Desktop aberto com AnkiConnect; testes independentes por User Story
**Target Platform**: Windows, Python 3.11+, executado como skill pelo agente
**Project Type**: CLI script (skill reutilizável)
**Performance Goals**: Batch de até 500 flashcards enviado em menos de 30s
**Constraints**: Timeout 5s por request AnkiConnect; sem dependências externas; porta 8765
**Scale/Scope**: Single user, single deck por sessão, ~10–500 flashcards por exportação

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | ✅ PASS | Todas as mensagens ao usuário em PT-BR (spec FR-001, FR-010) |
| II | Confirmação Antes de Ações | ✅ PASS | Confirmação de batch (FR-007) e de novo deck (FR-004) obrigatórias |
| III | Pipeline Sequencial | ✅ PASS | Feature é fase terminal — depende de 002, 004, 005; retomada via Foundation |
| IV | Dados Estruturados | ✅ PASS | Adicionado `anki_result_*.json` para persistir resultado da exportação (além do `.txt` de fallback) |
| V | RAG com Validação | ✅ PASS | Sem web search; lê apenas dados locais |
| VI | Separação de Responsabilidades | ✅ PASS | 5 arquivos com responsabilidade única cada (ver Estrutura abaixo) |
| VII | Observabilidade | ✅ PASS | Logs via Foundation (spec 002) em `/logs/execution_log.json` |
| VIII | Evolução Compatível | ✅ PASS | Lê campo `version` dos JSONs; sem breaking change em contratos existentes |
| IX | Desenvolvimento Orientado ao Aprendizado | ✅ PASS | Padrões nomeados neste plan; tasks terão responsabilidade única |

**Resultado: GATE PASS** — sem violações. Observação em IV resolvida: resultado da exportação
terá representação JSON estruturada além do `.txt` importável.

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.
> Aprenda o nome de cada padrão — você os encontrará em todo projeto Python.

### Padrão 1 — Adapter (Adaptador)

**O que é**: Uma camada fina que traduz chamadas do seu código para o formato específico de
uma API externa. Seu código chama `listar_decks()`, o Adapter traduz isso para o JSON
`{"action": "deckNames", "version": 6, "params": {}}` que o AnkiConnect entende.

**Por que usamos aqui**: O AnkiConnect tem um formato de request específico. Em vez de
espalhar detalhes de HTTP por todo o código, um único arquivo centraliza essa tradução.
Se a API mudar, só esse arquivo precisa ser atualizado.

**Arquivo**: `anki_connector.py`

---

### Padrão 2 — Repository (Repositório)

**O que é**: Um objeto que sabe ler e escrever dados de um lugar específico (arquivo, banco
de dados) e expõe uma interface limpa. O restante do código não sabe de onde os dados vêm.

**Por que usamos aqui**: A lógica de negócio (como montar um flashcard) não deve precisar
saber que os dados estão em arquivos JSON. O Repository lê `topicos.json` e
`relevancia_topicos.json` e entrega os dados como listas Python. Se mudarmos para banco de
dados no futuro, só o Repository muda — o restante do código continua igual.

**Arquivo**: `anki_repository.py`

---

### Padrão 3 — Service Layer (Camada de Serviço)

**O que é**: O arquivo que contém as "regras de negócio" — o que o sistema faz,
independente de onde os dados vêm ou como são exibidos.

**Por que usamos aqui**: "Frente do card = L0, verso = L1+L2, tag = matéria + relevância"
é uma regra de negócio — fica em `flashcard_service.py`. "Procurar deck com nome parecido
com a matéria" é outra regra — fica em `deck_service.py`. Esses arquivos não fazem HTTP
nem leem arquivos; recebem dados e retornam dados.

**Arquivos**: `flashcard_service.py`, `deck_service.py`

---

### Padrão 4 — Tratamento Defensivo de Erros

**O que é**: Verificar pré-condições antes de agir e ter um caminho alternativo quando
algo falha. O nome "defensivo" vem de "defender o usuário contra falhas do ambiente".

**Por que usamos aqui**: O AnkiConnect pode estar indisponível (Anki fechado). Em vez de
deixar o código falhar com um erro genérico, verificamos conectividade primeiro (FR-001)
e, se falhar, oferecemos o fallback para arquivo `.txt`. O usuário nunca perde trabalho.

**Implementado em**: `anki_connector.py` (verificação de conectividade), `anki_export.py`
(decisão de fallback)

## Project Structure

### Documentation (esta feature)

```text
specs/007-study-anki-export/
├── plan.md              # Este arquivo
├── research.md          # Pesquisa: API AnkiConnect + contratos de dados (Phase 0)
├── data-model.md        # Entidades: Flashcard, Deck, ArquivoFallback (Phase 1)
├── quickstart.md        # Como testar cada User Story manualmente (Phase 1)
├── contracts/
│   └── ankiconnect.md   # Contrato: chamadas AnkiConnect utilizadas (Phase 1)
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Source Code (skill reutilizável)

```text
.github/skills/study-anki/
├── anki_connector.py     # Adapter — HTTP com AnkiConnect          [NOVO]
├── anki_repository.py    # Repository — lê topicos.json + relevancia_topicos.json  [NOVO]
├── deck_service.py       # Service — listagem, busca e recomendação de deck         [NOVO]
├── flashcard_service.py  # Service — monta flashcards a partir de tópicos           [NOVO]
├── anki_export.py        # Orquestrador CLI — fluxo completo de exportação          [NOVO]
└── send_to_anki.py       # Skill existente (card único) — mantida sem alteração     [EXISTENTE]

data/                     # Runtime — criado pela spec 002
├── topicos.json                      # Input (spec 004 — obrigatório)
├── relevancia_topicos.json           # Input (spec 005 — opcional)
├── anki_export_<mat>_<dt>.txt        # Fallback offline (User Story 3)
└── anki_result_<mat>_<dt>.json       # Resultado estruturado da exportação

logs/
└── execution_log.json                # Logs estruturados (spec 002 Foundation)
```

**Structure Decision**: Single project — CLI skill. O `send_to_anki.py` existente não é
alterado (compatibilidade com spec 002 — Princípio VIII). O novo `anki_export.py` é o
ponto de entrada desta feature; os demais arquivos são bibliotecas internas chamadas por ele.

## Complexity Tracking

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação (Visão Geral)

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra
> as fases e o padrão aplicado em cada uma — para que você entenda a sequência lógica
> antes de ver as tasks.

### Fase 1 — Infraestrutura de Comunicação e Dados (Fundação desta feature)

**Padrão aplicado**: Adapter + Repository

Cria os dois arquivos que isolam o "mundo externo" (AnkiConnect e arquivos JSON) do
restante do código. Sem esta fase, nenhuma lógica de negócio pode ser testada.

- `anki_connector.py` — verifica conectividade, lista decks, envia batch de notas
- `anki_repository.py` — lê e valida `topicos.json` e `relevancia_topicos.json`

**Checkpoint desta fase**: Adapter + Repository prontos — lógica de negócio pode começar.

---

### Fase 2 — User Story 1: Listagem e Recomendação de Deck

**Padrão aplicado**: Service Layer

Implementa `deck_service.py` com duas funções: listar decks (via Adapter) e recomendar
deck (match parcial entre nome do deck e matéria). O usuário pode confirmar ou escolher
outro deck.

**Checkpoint desta fase**: Com Anki aberto, `anki_export.py --list-decks --materia "Direito"` exibe decks e recomendação.

---

### Fase 3 — User Story 2: Exportação Batch de Flashcards

**Padrão aplicado**: Service Layer + Tratamento Defensivo de Erros

Implementa `flashcard_service.py` (monta flashcards) e o fluxo de exportação em
`anki_export.py` (confirma com usuário, envia via Adapter, reporta resultado, persiste
`anki_result_*.json`).

**Checkpoint desta fase**: Com `topicos.json` e `relevancia_topicos.json` presentes, a
exportação completa funciona end-to-end com confirmação, envio e relatório final.

---

### Fase 4 — User Story 3: Fallback sem AnkiConnect

**Padrão aplicado**: Tratamento Defensivo de Erros + Strategy (implícito)

Implementa o caminho alternativo: detecta que AnkiConnect não está disponível, salva
flashcards em `anki_export_<mat>_<dt>.txt` e oferece reenvio quando AnkiConnect voltar.

**Checkpoint desta fase**: Com porta 8765 indisponível, a exportação gera arquivo de
fallback importável pelo Anki File > Import.
