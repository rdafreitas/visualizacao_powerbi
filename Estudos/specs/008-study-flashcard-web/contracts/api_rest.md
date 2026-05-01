# Contrato: API REST — Study Flashcard Web

**Feature**: `008-study-flashcard-web` | **Date**: 2026-04-30  
**Base URL**: `http://localhost:3000`

> Este contrato define os endpoints expostos pelo backend Express.js. O frontend v1 (HTML+JS) e o frontend v2 (React) consomem exatamente estes endpoints — o backend não muda entre as versões.

---

## Convenções

- Content-Type: `application/json` em todas as respostas de API
- Erros retornam `{ "erro": "<mensagem em PT-BR>" }` com o HTTP status adequado
- Datas no formato ISO 8601: `YYYY-MM-DD` (data) ou `YYYY-MM-DDTHH:MM:SS` (datetime)

---

## Endpoints

### `GET /api/materias`

Lista matérias disponíveis com contagem de cards pendentes para hoje.

**Resposta 200**:
```json
{
  "materias": [
    {
      "id": "direito-constitucional",
      "nome": "Direito Constitucional",
      "total_cards": 42,
      "cards_pendentes_hoje": 7
    }
  ]
}
```

**Lógica**: Lê `topicos.json`, agrupa por matéria. Para cada matéria, cruza com `flashcard_progress_<mat>.json` para contar cards com `proxima_revisao` ≤ hoje.

---

### `GET /api/cards?materia=<id>`

Retorna os cards pendentes para revisão hoje na matéria especificada, ordenados por prioridade (relevância alta primeiro).

**Parâmetros**:
- `materia` (obrigatório): ID normalizado da matéria (ex: `direito-constitucional`)

**Resposta 200**:
```json
{
  "materia": "direito-constitucional",
  "total_pendentes": 7,
  "cards": [
    {
      "id": "t001",
      "frente": "O que é o princípio da legalidade?",
      "verso": "Ninguém é obrigado a fazer ou deixar de fazer algo...\n\nArt. 5º, II da CF/88.",
      "relevancia": "alta",
      "proxima_revisao": "2026-04-30",
      "resumo_link": null
    }
  ]
}
```

**Resposta 400**: `{ "erro": "Parâmetro 'materia' obrigatório" }`
**Resposta 404**: `{ "erro": "Nenhum tópico encontrado para a matéria informada" }`

---

### `POST /api/review`

Registra a avaliação de um card e atualiza o progresso SM-2.

**Request body**:
```json
{
  "topico_id": "t001",
  "materia": "direito-constitucional",
  "avaliacao": "bom"
}
```

**Validações**:
- `avaliacao`: enum `["errei", "dificil", "bom", "facil"]`
- `topico_id`: deve existir em `topicos.json`

**Resposta 200**:
```json
{
  "topico_id": "t001",
  "avaliacao": "bom",
  "xp_concedido": 30,
  "proximo_intervalo_dias": 6,
  "proxima_revisao": "2026-05-06"
}
```

**Resposta 400**: `{ "erro": "Avaliação inválida. Use: errei, dificil, bom, facil" }`

**Efeitos colaterais**:
1. Atualiza `flashcard_progress_<materia>.json` com novo estado SM-2
2. Appends evento em `flashcard_events.json`

---

### `POST /api/feedback`

Registra feedback do usuário sobre o conteúdo de um resumo.

**Request body**:
```json
{
  "topico_id": "t001",
  "materia": "direito-constitucional",
  "tipo_feedback": "com_erros",
  "observacao": "Falta mencionar a reserva de lei."
}
```

**Validações**:
- `tipo_feedback`: enum `["correto", "com_erros", "observacao"]`
- `observacao`: obrigatório quando `tipo_feedback == "observacao"`

**Resposta 200**:
```json
{
  "topico_id": "t001",
  "tipo_feedback": "com_erros",
  "xp_concedido": 15,
  "mensagem": "Feedback registrado. Obrigado por contribuir com a melhoria dos resumos!"
}
```

**Resposta 400**: `{ "erro": "'observacao' é obrigatória quando tipo_feedback é 'observacao'" }`

**Efeitos colaterais**:
1. Appends registro em `summary_feedback.json`

---

### `GET /api/character`

Retorna o estado atual do personagem da gamificação (consumido pela spec 009).

**Resposta 200** (spec 009 implementada):
```json
{
  "nome": "Candidato",
  "nivel": 3,
  "xp_total": 250,
  "xp_para_proximo_nivel": 50,
  "conquistas": [
    {
      "id": "modo_basico",
      "nome": "Modo Revisão Básico",
      "desbloqueada_em": "2026-04-30T10:00:00"
    }
  ]
}
```

**Resposta 200** (spec 009 não implementada — fallback):
```json
{
  "nome": "Candidato",
  "nivel": 1,
  "xp_total": 0,
  "xp_para_proximo_nivel": 100,
  "conquistas": [],
  "_aviso": "Gamificação não inicializada. Execute a spec 009 para ativar."
}
```

---

### `GET /api/dashboard`

Retorna dados consolidados para o dashboard de progresso.

**Resposta 200**:
```json
{
  "hoje": "2026-04-30",
  "cards_revisados_hoje": 12,
  "streak_dias": 5,
  "xp_total": 250,
  "nivel": 3,
  "proximas_revisoes": [
    { "data": "2026-05-01", "quantidade": 8 },
    { "data": "2026-05-02", "quantidade": 3 },
    { "data": "2026-05-06", "quantidade": 15 }
  ]
}
```

---

## Contrato de Eventos (para spec 009)

Os dois arquivos abaixo são o contrato de saída desta spec para a gamificação. A spec 009 os lê — nunca escreve neles.

### `/data/flashcard_events.json`

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

### `/data/summary_feedback.json`

```json
{
  "feedbacks": [
    {
      "id": "fb_20260430_100500_t001",
      "topico_id": "t001",
      "materia": "direito-constitucional",
      "tipo_feedback": "com_erros",
      "observacao": "Falta mencionar a reserva de lei.",
      "xp_concedido": 15,
      "timestamp": "2026-04-30T10:05:00"
    }
  ]
}
```
