---
name: sheets-to-toggl
description: Use para criar projetos e tarefas no Toggl Track a partir das atividades do ciclo trimestral, seguindo as regras de formatação: título sem categoria, task com o que foi feito e tag com a categoria.
---

# sheets-to-toggl

Cria projetos e tarefas no Toggl Track com base nas atividades do ciclo trimestral, aplicando as regras de formatação definidas.

## Regras de Formatação

| Campo no Toggl | Regra | Exemplo |
|---|---|---|
| **Título do Card (Projeto)** | `ID_Meta` sem `[Categoria]` | `M01 · Crescer presença digital` |
| **Task** | "O que foi feito" (col E da planilha) | `Responder comentários da semana` |
| **Tag** | Categoria extraída dos `[ ]` | `Marketing` |

**Como extrair Categoria e ID_Meta de um título:**

Se o campo Meta na planilha for: `[Marketing] M01 · Crescer presença digital`
- Categoria = `Marketing` (conteúdo entre `[` e `]`)
- ID_Meta = `M01 · Crescer presença digital` (tudo após `] `)

```python
import re

def extrair_meta(titulo_completo):
    match = re.match(r'\[([^\]]+)\]\s*(.*)', titulo_completo)
    if match:
        return match.group(1), match.group(2)
    return None, titulo_completo
```

## Passos de Execução

### 1. Ler tarefas do ciclo atual

```python
rows = service.spreadsheets().values().get(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'CICLO TRIMESTRAL'!A2:H"
).execute().get('values', [])
```

### 2. Obter Workspace ID do Toggl

```bash
curl -s \
  -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/me" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['default_workspace_id'])"
```

### 3. Garantir que o Projeto existe no Toggl

Para cada Meta única no ciclo:

```bash
# Listar projetos existentes
curl -s \
  -u "$TOGGL_API_TOKEN:api_token" \
  "https://api.track.toggl.com/api/v9/workspaces/$WORKSPACE_ID/projects"

# Criar projeto se não existir
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "<ID_META>", "active": true}' \
  "https://api.track.toggl.com/api/v9/workspaces/$WORKSPACE_ID/projects"
```

### 4. Garantir que a Tag existe no Toggl

```bash
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "<CATEGORIA>"}' \
  "https://api.track.toggl.com/api/v9/workspaces/$WORKSPACE_ID/tags"
```

> Se a tag já existir, o Toggl retorna a existente sem erro.

### 5. Criar Time Entry para cada tarefa

```bash
curl -s -X POST \
  -u "$TOGGL_API_TOKEN:api_token" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "<O_QUE_FOI_FEITO>",
    "project_id": <PROJECT_ID>,
    "tag_ids": [<TAG_ID>],
    "workspace_id": <WORKSPACE_ID>,
    "created_with": "gsheet-rotina"
  }' \
  "https://api.track.toggl.com/api/v9/workspaces/$WORKSPACE_ID/time_entries"
```

> Nota: Time entries sem `start`/`duration` ficam como rascunhos. Para registros históricos, incluir `start` (ISO 8601) e `duration` (em segundos, negativo = em andamento).

### 6. Exibir resumo

```
✔ Toggl atualizado — 17/06/2026
  Projetos criados  : 2
  Tags criadas      : 1
  Entradas criadas  : 7

  Projetos:
  · M01 · Crescer presença digital  [Marketing]
  · M02 · Desenvolver habilidade X  [Educação]
```

## Tratamento de Erros

| Situação | Ação |
|---|---|
| Projeto duplicado | Usar o existente (não criar novo) |
| Tag duplicada | Usar a existente |
| HTTP 403 | Verificar `TOGGL_API_TOKEN` |
| `[Categoria]` ausente no título | Criar tag `Sem Categoria` e registrar aviso |

## Referência de Regras

Ver [`references/toggl-rules.md`](references/toggl-rules.md) para exemplos completos de transformação e casos especiais.
