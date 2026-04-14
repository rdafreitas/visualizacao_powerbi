# Epic Specification: Study Concurso Agent

**Feature Branch**: `001-study-agent-epic`
**Created**: 2026-04-13
**Status**: Epic — Decomposed
**Type**: Architecture Vision / Master Spec

---

## Visão Global do Sistema

### Objetivo

O Study Concurso Agent é um agente de IA que automatiza o pipeline completo de preparação de materiais de estudo para concursos públicos brasileiros, transformando PDFs brutos (materiais e editais) em artefatos estruturados, priorizados e publicados em múltiplos formatos de consumo.

### Problema

Preparar materiais de estudo para concursos é um processo manual, fragmentado e não-rastreável:
- Extração manual de conteúdos de editais
- Organização subjetiva de tópicos
- Priorização baseada em intuição, não em dados
- Manutenção manual em múltiplos sistemas (docs, Anki)
- Impossibilidade de retomar ou reprocessar parcialmente

### Pipeline Completo

```
[PDF Material]  [PDF Edital]
      │               │
      ▼               ▼
  Conversão MD    Conversão MD
      │               │
      ▼               ▼
  Split matéria   Parsing estruturado
  / questões      (cargo, banca, matérias)
      │               │
      ▼               │
  JSON tópicos        │
  JSON questões       │
      │               │
      ▼               ▼
  Outline L0–L3   edital_parsed.json
      │               │
      └───────┬───────┘
              ▼
      Classificação de
      relevância 🔥/⚠️/📝
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
   Google   Markdown  Anki
    Docs    local    flashcards
```

### Escopo Macro (v1)

**Incluído**: Conversão PDF→MD, parsing de editais, geração de resumos hierárquicos, classificação de relevância, publicação Google Docs, versionamento local, exportação Anki, memória persistente, logging, modo debug, retomada de execução.

**Excluído (v1)**: OCR de PDFs escaneados, banco externo de provas, web search obrigatório, interface web/mobile, suporte multi-user.

---

## Decomposição em Feature Specs

| # | Spec | Role | Escopo | Rationale |
|---|------|------|--------|-----------|
| 002 | [study-foundation](../002-study-foundation/spec.md) | Foundation | Memória persistente, logging estruturado, modo debug, checkpoint/retomada, confirmação de ações, contratos de dados JSON, comunicação PT-BR | Infraestrutura transversal — Constitution III (Pipeline Sequencial), IV (Dados como Verdade), VII (Observabilidade), II (Confirmação) exigem que esses contratos existam antes de qualquer feature |
| 003 | [study-edital-processing](../003-study-edital-processing/spec.md) | Feature | Pipeline de edital: PDF → Markdown → extração estruturada (cargo, banca, matérias, pesos) → `edital_parsed.json` | Bounded context isolado de ingestão. Produz contexto que enriquece a classificação mas não é obrigatório para o pipeline principal |
| 004 | [study-summary-generation](../004-study-summary-generation/spec.md) | Feature | Pipeline de resumo: PDF → Markdown → split matéria/questões → JSON de tópicos → outline L0–L3 com referência editorial | Core value do sistema — transformação central que produz os artefatos que todos os outputs consomem |
| 005 | [study-relevance-engine](../005-study-relevance-engine/spec.md) | Feature | Classificação de relevância 🔥/⚠️/📝 para tópicos e questões, com justificativa e fontes | Lógica de análise pura (sem IO). Consome JSONs, produz JSONs. Alinha com Constitution V (RAG) e VI (Separação) |
| 006 | [study-gdoc-publishing](../006-study-gdoc-publishing/spec.md) | Feature | Publicação em Google Docs (resumo + questões), formatação com ícones, versionamento local Markdown | Canal de output — apresentação. Agrupa resumo e questões por compartilharem mesma infraestrutura |
| 007 | [study-anki-export](../007-study-anki-export/spec.md) | Feature | Listagem de decks, recomendação, envio batch de flashcards com tags | Canal de output independente — integração Anki com bounded context claro |

---

## Dependências Entre Specs

```
002-foundation ──────────────────────────────────────┐
     │                                               │
     ├─→ 003-edital-processing                       │
     │         │                                     │
     ├─→ 004-summary-generation                      │
     │         │                                     │
     │    003 ─┘ (contexto opcional para relevância) │
     │                                               │
     ├─→ 005-relevance-engine                        │
     │     ← requer 004 (tópicos/questões JSON)      │
     │     ← opcional 003 (edital para contexto)     │
     │         │                                     │
     ├─→ 006-gdoc-publishing                         │
     │     ← requer 004 (tópicos/questões)           │
     │     ← requer 005 (classificação)              │
     │                                               │
     └─→ 007-anki-export                             │
           ← requer 004 (tópicos)                   │
           ← requer 005 (classificação)              │
           paralelo com 006 ────────────────────────┘
```

**Regras**:
- Nenhuma spec pode iniciar implementação sem **002** concluída
- **003** e **004** são independentes entre si
- **005** requer output de **004**; consome **003** opcionalmente
- **006** e **007** são independentes entre si; ambas requerem **004** + **005**

---

## Roadmap Macro de Implementação

| Wave | Specs | Paralelo? | Entregável | MVP? |
|------|-------|-----------|------------|------|
| **Wave 1** | 002-study-foundation | — | Memória, logging, debug, checkpoint, contratos JSON | Infra |
| **Wave 2** | 003-edital + 004-summary | Sim | Edital parseado + tópicos/questões estruturados | 004 = MVP mínimo |
| **Wave 3** | 005-relevance-engine | — | Classificação 🔥/⚠️/📝 com justificativa | — |
| **Wave 4** | 006-gdoc + 007-anki | Sim | Google Docs formatados + flashcards Anki | Pipeline completo |

**MVP mínimo**: Wave 1 + 004 → já entrega resumos estruturados em JSON.
**MVP com output**: Wave 1 + 004 + 006 → resumos publicados em Google Docs.

---

## Rationale Arquitetural

### Por que decompor?

A spec monolítica original continha 6 user stories, 21 FRs e 8 SCs cobrindo desde infraestrutura transversal até integrações externas. Problemas:

1. **Impossibilidade de plan.md de qualidade** — um único plan.md tentaria cobrir memória, parsing, resumo, classificação, Google Docs e Anki simultaneamente
2. **Tasks sem granularidade** — tasks.md misturaria fundações com features, impedindo entrega incremental
3. **Acoplamento de testes** — testar o pipeline inteiro para validar uma mudança em Anki

### Princípios aplicados

- **Constitution VI (Separação de Responsabilidades)**: Cada spec cobre um bounded context
- **Constitution III (Pipeline Sequencial)**: A decomposição respeita a sequência natural do pipeline
- **Constitution VIII (Evolução Versionada)**: Specs podem evoluir independentemente
- **Independência de Entrega**: Cada spec gera valor testável isoladamente

### Decisões de contorno

| Decisão | Alternativa descartada | Rationale |
|---------|----------------------|-----------|
| Agrupar resumo + questões em 006-gdoc | Specs separadas 006-gdoc-resumo e 007-gdoc-questoes | Compartilham mesma infra (Google Docs API, formatação, versionamento). Specs separadas seriam micro-specs artificiais |
| Foundation como spec, não como cross-cutting implícito | Distribuir FR-012 a FR-018 em cada feature spec | Sem foundation explícita, cada spec reimplementaria memória/logging. Viola DRY e Constitution VII |
| Edital separado de Summary | Edital como sub-fase de Summary | Edital é opcional no pipeline; Summary funciona sem ele. São bounded contexts distintos com inputs/outputs diferentes |

---

## Rastreabilidade FR → Spec Filha

| FR Original | Descrição | Spec Destino |
|-------------|-----------|--------------|
| FR-001 | PDF → Markdown (material) | 004 |
| FR-002 | Split matéria/questões → JSON | 004 |
| FR-003 | Outline L0–L3 | 004 |
| FR-004 | Referência editorial | 004 |
| FR-005 | PDF edital → MD + extração | 003 |
| FR-006 | Auto-conversão `/input/editais/` | 003 |
| FR-007 | Classificação 🔥/⚠️/📝 | 005 |
| FR-008 | Justificativa + fontes | 005 |
| FR-009 | Google Docs com hierarquia | 006 |
| FR-010 | Ícones relevância nos Docs | 006 |
| FR-011 | Markdown local ANTES de publicar | 006 |
| FR-012 | Persistência JSON `/data/` | 002 |
| FR-013 | Memória + retomada por hash | 002 |
| FR-014 | Confirmação ações destrutivas | 002 |
| FR-015 | Listar decks Anki | 007 |
| FR-016 | Envio batch flashcards | 007 |
| FR-017 | Logging estruturado | 002 |
| FR-018 | Modo debug | 002 |
| FR-019 | Sem web search v1 | 005 |
| FR-020 | Comunicação PT-BR | 002 |
| FR-021 | Reprocessamento check | 002 |

---

## Rastreabilidade US → Spec Filha

| US Original | Descrição | Spec(s) Destino |
|-------------|-----------|-----------------|
| US1 (P1) | Conversão e Estruturação | 004 (transformação) + 006 (publicação) |
| US2 (P2) | Parsing de Edital | 003 |
| US3 (P3) | Classificação de Relevância | 005 |
| US4 (P4) | Questões em Google Docs | 006 |
| US5 (P5) | Flashcards Anki | 007 |
| US6 (P6) | Observabilidade e Debug | 002 |

---

## Rastreabilidade SC → Spec Filha

| SC Original | Descrição | Spec(s) Destino |
|-------------|-----------|-----------------|
| SC-001 | < 10 min interação | 004 + 006 |
| SC-002 | 100% artefatos intermediários | 002 + 004 |
| SC-003 | Retomada 100% | 002 |
| SC-004 | Justificativa + fontes 100% | 005 |
| SC-005 | Consistência estrutural | 004 |
| SC-006 | GDoc preserva hierarquia | 006 |
| SC-007 | Redução 70% tempo | End-to-end (todas) |
| SC-008 | Auditabilidade via logs | 002 |

---

## Assumptions Globais

- Ambiente Windows com Python 3.11+.
- Usuário único (multi-user fora de escopo v1).
- PDFs contêm texto extraível (sem OCR).
- Web search desabilitado na v1.
- Google credentials e AnkiConnect disponíveis quando respectivas specs forem utilizadas.
- Google Docs de referência editorial acessíveis para alinhamento de estilo.
