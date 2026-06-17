---
name: sheets-to-habitica
description: Use para enviar as tarefas do ciclo trimestral atual para a lista de To-Do do Habitica. Cria apenas as tarefas ainda não existentes, evitando duplicatas.
---

# sheets-to-habitica

Lê as tarefas do ciclo atual na planilha e as cria como **To-Dos** no Habitica, vinculando o ID da atividade para rastreamento.

## Regras de Sincronização

- Somente tarefas com status **em aberto** (coluna F vazia ou `✘`) são enviadas.
- Antes de criar, a skill verifica se já existe um To-Do no Habitica com o mesmo texto (detecção de duplicata via `notes`).
- O campo `notes` do To-Do armazena o `ID_Atividade` para permitir rastreamento bidirecional.

## Mapeamento de Campos

| Campo Planilha | Campo Habitica | Exemplo |
|---|---|---|
| Tarefa (col E) | `text` | `Responder comentários da semana` |
| ID Atividade (col A) | `notes` | `M01-A02-T01` |
| Categoria (col B) | `tags` (por nome) | `Marketing` |
| Meta (col C) | `notes` (append) | `M01 · Crescer presença digital` |

## Passos de Execução

### 1. Ler tarefas abertas do ciclo atual

```python
rows = service.spreadsheets().values().get(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'CICLO TRIMESTRAL'!A2:H"
).execute().get('values', [])

tarefas = [r for r in rows if len(r) >= 5 and (len(r) < 6 or r[5] in ('', '✘'))]
```

### 2. Buscar To-Dos existentes no Habitica

```bash
curl -s \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina-sheets-to-habitica" \
  "https://habitica.com/api/v3/tasks/user?type=todos"
```

Extrair os `notes` dos To-Dos existentes para comparação.

### 3. Filtrar tarefas não enviadas ainda

```python
ids_existentes = {t['notes'].split('\n')[0] for t in todos_habitica if t.get('notes')}
tarefas_novas  = [r for r in tarefas if r[0] not in ids_existentes]
```

### 4. Criar To-Dos no Habitica

Para cada tarefa nova:

```bash
curl -s -X POST \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina-sheets-to-habitica" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "<TAREFA>",
    "type": "todo",
    "notes": "<ID_ATIVIDADE>\n<META>",
    "tags": ["<TAG_ID_CATEGORIA>"]
  }' \
  "https://habitica.com/api/v3/tasks/user"
```

> Para usar tags por nome, primeiro obter o ID da tag via `GET /tags` ou criar com `POST /tags`.

### 5. Exibir resumo

```
✔ Tarefas enviadas ao Habitica — 17/06/2026
  Novas criadas  : 5
  Já existentes  : 3 (ignoradas)
  Erros          : 0

  Criadas:
  · M01-A02-T01 · Responder comentários
  · M01-A02-T02 · Fazer live de Q&A
  · M02-A01-T01 · Estudar módulo 3
  · M02-A01-T02 · Praticar exercício X
  · M03-A01-T01 · Revisar documentação
```

## Tratamento de Erros

| Situação | Ação |
|---|---|
| Tag não existe no Habitica | Criar automaticamente antes de enviar |
| To-Do duplicado detectado | Ignorar e listar no resumo como "já existente" |
| HTTP 429 (rate limit) | Aguardar 30s e retentar |

## Referência da API

Ver [`references/habitica-todo-api.md`](references/habitica-todo-api.md) para detalhes dos campos e exemplos de resposta.
