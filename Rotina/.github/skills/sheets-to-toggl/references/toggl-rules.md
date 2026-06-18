# Referência: Regras de Formatação Toggl

## Regra de Transformação

Dado um título de meta no formato `[Categoria] ID_Meta · Descrição`, aplicar:

| Campo Toggl | Origem | Resultado |
|---|---|---|
| **Título do Card (Projeto)** | Meta sem `[Categoria]` | `ID_Meta · Descrição` |
| **Task (description)** | Coluna "O que foi feito" | `Responder comentários da semana` |
| **Tag** | Categoria extraída de `[ ]` | `Marketing` |

## Exemplos de Transformação

### Exemplo 1

```
Meta na planilha : [Marketing] M01 · Crescer presença digital
↓
Projeto Toggl    : M01 · Crescer presença digital
Tag              : Marketing
```

### Exemplo 2

```
Meta na planilha : [Educação] M02 · Desenvolver habilidade X
↓
Projeto Toggl    : M02 · Desenvolver habilidade X
Tag              : Educação
```

### Exemplo 3 — Sem categoria

```
Meta na planilha : M03 · Projeto de conclusão (sem [ ])
↓
Projeto Toggl    : M03 · Projeto de conclusão
Tag              : Sem Categoria   ← tag padrão
```

## Código de Extração

```python
import re

def extrair_meta(titulo_completo: str) -> tuple[str, str]:
    """
    Retorna (categoria, id_meta).
    Se não houver [Categoria], retorna ('Sem Categoria', titulo_completo).
    """
    match = re.match(r'^\[([^\]]+)\]\s*(.*)', titulo_completo.strip())
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return 'Sem Categoria', titulo_completo.strip()
```

## Toggl Track API — Referência Rápida

Base URL: `https://api.track.toggl.com/api/v9`

Autenticação: Basic Auth com `API_TOKEN:api_token`

```bash
curl -u "$TOGGL_API_TOKEN:api_token" ...
```

### Obter workspace padrão

```bash
curl -s -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/me" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['default_workspace_id'])"
```

### Listar projetos

```bash
curl -s -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/workspaces/$WID/projects"
```

### Criar projeto

```bash
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "M01 · Crescer presença digital", "active": true}' \
  "https://api.track.toggl.com/api/v9/workspaces/$WID/projects"
```

### Listar tags

```bash
curl -s -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/workspaces/$WID/tags"
```

### Criar tag

```bash
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marketing"}' \
  "https://api.track.toggl.com/api/v9/workspaces/$WID/tags"
```

### Criar time entry

```bash
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Responder comentários da semana",
    "project_id": 123456789,
    "tag_ids": [987654321],
    "workspace_id": 111222333,
    "start": "2026-06-17T09:00:00+00:00",
    "duration": -1,
    "created_with": "gsheet-rotina"
  }' \
  "https://api.track.toggl.com/api/v9/workspaces/$WID/time_entries"
```

> `"duration": -1` = timer em andamento. Para registros históricos, usar duração em segundos (ex.: `3600` = 1 hora).

## Documentação oficial

https://engineering.toggl.com/docs/track
