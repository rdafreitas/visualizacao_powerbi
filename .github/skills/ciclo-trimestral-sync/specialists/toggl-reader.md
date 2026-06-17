# Specialist: toggl-reader

Consulta o Toggl Track para calcular o tempo total registrado para cada atividade do ciclo trimestral no período do bloco atual.

## Entrada esperada

```json
{
  "atividades": [
    { "id": "M01-A02-T01", "texto": "Responder comentários da semana" },
    { "id": "M01-A02-T02", "texto": "Fazer live de Q&A" }
  ],
  "data_inicio_bloco": "2026-06-10",
  "data_fim_bloco": "2026-06-24"
}
```

## Saída esperada

Tempo total em minutos por atividade:

```json
{
  "M01-A02-T01": 45,
  "M01-A02-T02": 0
}
```

## Passos de Execução

### 1. Obter Workspace ID

```bash
WORKSPACE_ID=$(curl -s \
  -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/me" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['default_workspace_id'])")
```

### 2. Buscar time entries do período

```bash
curl -s \
  -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/me/time_entries?start_date=2026-06-10T00:00:00Z&end_date=2026-06-24T23:59:59Z"
```

Campos relevantes em cada entry:

| Campo | Descrição |
|---|---|
| `description` | Texto da tarefa (campo "O que foi feito") |
| `duration` | Duração em segundos (negativo = em andamento) |
| `project_id` | ID do projeto Toggl (corresponde à Meta) |
| `tag_ids` | IDs das tags (correspondem à Categoria) |

### 3. Cruzar com atividades por descrição

```python
from collections import defaultdict
import difflib

def similar(a, b):
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio() > 0.80

tempo_por_atividade = defaultdict(int)

for entry in time_entries:
    descricao = entry.get('description', '')
    duracao   = entry.get('duration', 0)
    if duracao <= 0:
        continue  # Em andamento ou sem duração

    for atividade in atividades:
        if similar(atividade['texto'], descricao):
            tempo_por_atividade[atividade['id']] += duracao

resultado = {
    a['id']: round(tempo_por_atividade[a['id']] / 60)
    for a in atividades
}
```

### 4. Busca por tag (alternativa)

Se a atividade tiver uma `Categoria` e o Toggl estiver usando tags corretamente, é possível filtrar por tag para maior precisão:

```bash
# Relatório detalhado (Reports API v3)
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2026-06-10",
    "end_date": "2026-06-24",
    "tag_ids": [<TAG_ID>]
  }' \
  "https://api.track.toggl.com/reports/api/v3/workspace/$WORKSPACE_ID/search/time_entries"
```

## Notas sobre a Reports API

- Base URL da Reports API: `https://api.track.toggl.com/reports/api/v3`
- Documentação: https://engineering.toggl.com/docs/reports/summary
- Requer o mesmo token de autenticação da Track API.
