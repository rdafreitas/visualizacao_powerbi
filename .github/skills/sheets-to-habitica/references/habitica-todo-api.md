# Referência: Habitica To-Do API

## Criar To-Do

```
POST https://habitica.com/api/v3/tasks/user
```

### Body (JSON)

```json
{
  "text": "Texto da tarefa",
  "type": "todo",
  "notes": "M01-A02-T01\nM01 · Crescer presença digital",
  "tags": ["uuid-da-tag"],
  "priority": 1,
  "date": "2026-06-24"
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `text` | string | sim | Texto principal do To-Do |
| `type` | string | sim | Sempre `"todo"` |
| `notes` | string | não | Notas adicionais (usar para armazenar ID_Atividade) |
| `tags` | array | não | Lista de UUIDs de tags |
| `priority` | float | não | `0.1`=trivial, `1`=médio, `1.5`=difícil, `2`=chefe |
| `date` | string | não | Data de vencimento (ISO 8601) |

---

## Listar To-Dos em aberto

```
GET https://habitica.com/api/v3/tasks/user?type=todos
```

---

## Listar To-Dos completados (últimos 30)

```
GET https://habitica.com/api/v3/tasks/user?type=completedTodos
```

---

## Marcar To-Do como concluído

```
POST https://habitica.com/api/v3/tasks/{taskId}/score/up
```

---

## Gerenciar Tags

### Listar tags

```
GET https://habitica.com/api/v3/tags
```

### Criar tag

```
POST https://habitica.com/api/v3/tags
Body: { "name": "Marketing" }
```

Resposta inclui o `id` UUID da tag recém-criada.

---

## Exemplo completo: criar To-Do com tag

```bash
# 1. Obter ou criar tag
TAG_ID=$(curl -s -X POST \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marketing"}' \
  "https://habitica.com/api/v3/tags" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")

# 2. Criar To-Do
curl -s -X POST \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"Responder comentários da semana\",
    \"type\": \"todo\",
    \"notes\": \"M01-A02-T01\nM01 · Crescer presença digital\",
    \"tags\": [\"$TAG_ID\"]
  }" \
  "https://habitica.com/api/v3/tasks/user"
```

---

## Notas

- Tags com o mesmo nome não são criadas em duplicata — Habitica retorna a existente.
- O campo `notes` é texto livre; usamos a primeira linha como `ID_Atividade` para rastreamento.
- Rate limit: 30 req/min. Em criações em lote, adicionar `sleep 2` entre chamadas.
