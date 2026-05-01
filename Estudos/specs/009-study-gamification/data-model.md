# Data Model: Study Gamification

**Feature**: `009-study-gamification` | **Date**: 2026-04-30

> **Por que um data model?** Define os objetos que o sistema mantém em disco e as regras que os governam. A gamificação tem uma entidade principal (Personagem) e entidades de apoio (Conquista, EventoXP, Notificação).

---

## Entidade Principal Persistida: Personagem

Arquivo: `/data/character_state.json` — lido e atualizado pela spec 009.

```json
{
  "meta": {
    "version": "1.0",
    "updated_at": "2026-04-30T10:30:00"
  },
  "personagem": {
    "nome": "Candidato",
    "nivel": 3,
    "xp_total": 250,
    "xp_para_proximo_nivel": 50,
    "conquistas": [
      {
        "id": "modo_basico",
        "nome": "Modo Revisão Básico",
        "descricao": "Disponível desde o início",
        "nivel_requerido": 1,
        "desbloqueada_em": "2026-04-30T08:00:00"
      },
      {
        "id": "modo_quiz",
        "nome": "Modo Quiz",
        "descricao": "Cards sem frente/verso — o usuário digita a resposta",
        "nivel_requerido": 3,
        "desbloqueada_em": "2026-04-30T10:30:00"
      }
    ],
    "eventos_processados": [
      "evt_20260430_100000_t001",
      "evt_20260430_100500_t002",
      "fb_20260430_100800_t001"
    ]
  }
}
```

**Regras de validação**:
- `nivel` = `Math.floor(xp_total / 100) + 1` — sempre derivado de `xp_total`
- `xp_para_proximo_nivel` = `(nivel × 100) - xp_total`
- `conquistas[]` só contém marcos já alcançados (não exibir bloqueados)
- `eventos_processados[]` contém IDs de `flashcard_events.json` e `summary_feedback.json` já processados

---

## Entidade de Apoio: Notificação

Arquivo: `/data/gamification_notifications.json` — append-only, notificações pendentes de exibição.

```json
{
  "notificacoes": [
    {
      "id": "notif_20260430_103000",
      "tipo": "nivel_novo",
      "nivel": 3,
      "conquista_id": null,
      "mensagem": "Parabéns! Você chegou ao nível 3 e desbloqueou o Modo Quiz!",
      "timestamp": "2026-04-30T10:30:00",
      "exibida": false
    }
  ]
}
```

**Regras**:
- Quando nível novo + conquista nova → uma única notificação combinada com a mensagem PT-BR
- `exibida: false` → notificação pendente de exibição no próximo carregamento do dashboard
- Spec 008 marca `exibida: true` após exibir a notificação ao usuário

---

## Tabela de Marcos (definida em código, não em JSON)

Imutável na v1 — está hard-coded em `gamification_service.js`. Não precisa de arquivo externo.

| Nível | ID | Nome | Descrição |
|-------|----|------|-----------|
| 1 | `modo_basico` | Modo Revisão Básico | Disponível desde o início |
| 3 | `modo_quiz` | Modo Quiz | Cards sem frente/verso — digitar a resposta |
| 5 | `desafio_cronometrado` | Desafio Cronometrado | Contador regressivo por card |
| 8 | `modo_maratona` | Modo Maratona | Sessão sem limite de cards |
| 10 | `revisao_relevancia` | Revisão por Relevância | Apenas cards 🔥 alta relevância |
| 15 | `desafio_banca` | Desafio de Banca | Cards agrupados por banca do edital |

---

## Fluxo de Dados

```
flashcard_events.json      ──┐
                             ├──► gamification_service.js
summary_feedback.json      ──┘         │
                                       ▼
                               character_state.json (atualizado)
                               gamification_notifications.json (appended)
                                       │
                                       ▼
                            routes/character.js (spec 008)
                                       │
                                       ▼
                             GET /api/character → browser (dashboard)
```

---

## Relacionamentos com outras Specs

| Campo | Vínculo |
|-------|---------|
| `eventos_processados[]` | ←→ `EventoRevisao.id` em `flashcard_events.json` (spec 008) |
| `eventos_processados[]` | ←→ `FeedbackResumo.id` em `summary_feedback.json` (spec 008) |
| `conquistas[].id` | →→ Feature flags consumidos pela spec 008 para habilitar modos |
| `Notificação.exibida` | ←→ Marcado por spec 008 após exibir ao usuário |
