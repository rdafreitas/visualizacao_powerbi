# Specialist: habitica-reader

Verifica se cada atividade do ciclo trimestral foi concluída no Habitica, consultando os To-Dos completados recentemente.

## Entrada esperada

Lista de IDs de atividades e seus textos correspondentes:

```json
[
  { "id": "M01-A02-T01", "texto": "Responder comentários da semana" },
  { "id": "M01-A02-T02", "texto": "Fazer live de Q&A" }
]
```

## Saída esperada

```json
{
  "M01-A02-T01": true,
  "M01-A02-T02": false
}
```

## Passos de Execução

### 1. Buscar To-Dos completados

O Habitica retorna apenas os últimos 30 completados via este endpoint:

```bash
curl -s \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina-ciclo-sync" \
  "https://habitica.com/api/v3/tasks/user?type=completedTodos"
```

### 2. Buscar também To-Dos em aberto (para verificar se existem)

```bash
curl -s \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina-ciclo-sync" \
  "https://habitica.com/api/v3/tasks/user?type=todos"
```

### 3. Cruzar por ID armazenado em `notes`

A skill `sheets-to-habitica` armazena o `ID_Atividade` na primeira linha do campo `notes` de cada To-Do. Usar isso para cruzamento:

```python
concluidos = {t['notes'].split('\n')[0] for t in completados if t.get('notes')}
resultado  = {item['id']: (item['id'] in concluidos) for item in atividades}
```

### 4. Fallback: cruzar por texto

Se o `notes` não estiver preenchido, tentar correspondência por similaridade de texto:

```python
import difflib

def similar(a, b):
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio() > 0.85

textos_concluidos = [t['text'] for t in completados]
for item in atividades:
    if item['id'] not in resultado:
        resultado[item['id']] = any(similar(item['texto'], tc) for tc in textos_concluidos)
```

## Limitação

O Habitica retorna apenas os **30 To-Dos mais recentemente completados**. Para ciclos com mais de 30 tarefas concluídas, as mais antigas não serão detectadas. Neste caso, considerar registrar manualmente o status na planilha.
