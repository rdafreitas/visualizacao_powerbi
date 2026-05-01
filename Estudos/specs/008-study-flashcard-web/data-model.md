# Data Model: Study Flashcard Web

**Feature**: `008-study-flashcard-web` | **Date**: 2026-04-30

> **Por que um data model?** Define os "objetos" (dados) que o sistema mantém em memória e em disco. É o vocabulário compartilhado entre backend e frontend — sem isso, código e spec ficam desalinhados.

---

## Entidades Persistidas (arquivos JSON em `/data/`)

### CardProgresso

Estado SM-2 de cada card. Um arquivo por matéria: `/data/flashcard_progress_<materia>.json`.

```json
{
  "meta": {
    "materia": "direito-constitucional",
    "version": "1.0",
    "updated_at": "2026-04-30T10:00:00"
  },
  "cards": {
    "t001": {
      "topico_id": "t001",
      "intervalo": 6,
      "fator_facilidade": 2.5,
      "repeticoes": 2,
      "proxima_revisao": "2026-05-06",
      "ultima_avaliacao": "bom",
      "ultima_revisao_at": "2026-04-30T10:00:00"
    }
  }
}
```

**Regras de validação**:
- `fator_facilidade` ≥ 1.3 (nunca abaixo — SM-2)
- `intervalo` ≥ 1 (mínimo 1 dia)
- `proxima_revisao` formato YYYY-MM-DD
- Card novo (sem histórico): `{ intervalo: 1, fator_facilidade: 2.5, repeticoes: 0, proxima_revisao: <hoje> }`

---

### EventoRevisao

Registro imutável de cada revisão. Acumulativo em `/data/flashcard_events.json`.

```json
{
  "eventos": [
    {
      "id": "evt_20260430_100000_t001",
      "topico_id": "t001",
      "materia": "direito-constitucional",
      "avaliacao": "bom",
      "relevancia": "alta",
      "xp_concedido": 30,
      "timestamp": "2026-04-30T10:00:00"
    }
  ]
}
```

**Geração do ID**: `evt_<YYYYMMDD>_<HHMMSS>_<topico_id>` — suficiente para idempotência single-user.

**Regras**:
- `avaliacao`: enum `["errei", "dificil", "bom", "facil"]`
- `relevancia`: enum `["alta", "media", "baixa", "sem_classificacao"]`
- `xp_concedido`: calculado no momento do evento, nunca recalculado
- Arquivo é append-only — nunca deletar ou sobrescrever eventos

---

### FeedbackResumo

Registro de feedback do usuário sobre o conteúdo de um resumo. Acumulativo em `/data/summary_feedback.json`.

```json
{
  "feedbacks": [
    {
      "id": "fb_20260430_100500_t001",
      "topico_id": "t001",
      "materia": "direito-constitucional",
      "tipo_feedback": "com_erros",
      "observacao": "A definição de legalidade está incompleta — falta mencionar a reserva de lei.",
      "xp_concedido": 15,
      "timestamp": "2026-04-30T10:05:00"
    }
  ]
}
```

**Regras**:
- `tipo_feedback`: enum `["correto", "com_erros", "observacao"]`
- `observacao`: obrigatório quando `tipo_feedback == "observacao"`; null nas demais
- Arquivo é append-only

---

## Entidades em Memória (JavaScript, não persistidas)

### Card (objeto de sessão)

Representa um flashcard durante uma sessão de revisão — construído a partir de `topicos.json` + `flashcard_progress_<mat>.json`.

| Campo | Tipo | Origem |
|-------|------|--------|
| `id` | string | `topicos.json → data[].id` |
| `frente` | string | `topicos.json → L0` (texto do tópico nível 0) |
| `verso` | string | `topicos.json → L1 + L2` concatenados com `\n\n` |
| `materia` | string | `topicos.json → materia` |
| `relevancia` | string | `relevancia_topicos.json → relevancia` ou `"sem_classificacao"` |
| `proxima_revisao` | string | `flashcard_progress_<mat>.json → cards[id].proxima_revisao` |
| `resumo_link` | string\|null | Link para Google Doc (spec 006) ou caminho Markdown local |

**Regra de truncamento**:
- `frente` > 120 chars → truncar em 120 + `"..."`, colocar texto completo no início do `verso`

---

### SessaoRevisao (estado em memória do servidor)

Estado temporário de uma sessão ativa. Descartado ao final da sessão (não persiste).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `materia` | string | Matéria da sessão |
| `cards_pendentes` | Card[] | Cards com `proxima_revisao` ≤ hoje, em ordem de prioridade |
| `cards_revisados` | string[] | IDs revisados nesta sessão |
| `xp_sessao` | number | XP acumulado na sessão atual |
| `iniciada_em` | string | ISO 8601 |

---

## Fluxo de Dados

```
topicos.json              ──┐
                            ├──► flashcard_service.js ──► [Card] ──► GET /api/cards
relevancia_topicos.json   ──┘                                              │
                                                                           │ resposta
flashcard_progress_*.json ──► progress_repository.js                  browser
                                      │                              (review.html)
                                      ▼                                    │
                              srs_service.js ◄───────────────────── POST /api/review
                                      │                              { topico_id, avaliacao }
                                      ▼
                              flashcard_progress_*.json (atualizado)
                              flashcard_events.json    (evento appended)

summary_feedback.json ◄───────────────────── POST /api/feedback
                                             { topico_id, tipo_feedback, observacao }
```

---

## Relacionamentos com outras Specs

| Campo | Vínculo |
|-------|---------|
| `Card.id` | ←→ `topicos.json data[].id` (spec 004) |
| `Card.relevancia` | ←→ `relevancia_topicos.json` (spec 005) |
| `EventoRevisao.*` | →→ `flashcard_events.json` consumido por spec 009 |
| `FeedbackResumo.*` | →→ `summary_feedback.json` consumido por spec 009 |
| `Card.resumo_link` | ←→ Google Doc publicado por spec 006 (opcional) |
