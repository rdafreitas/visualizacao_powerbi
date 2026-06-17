---
name: ciclo-trimestral-sync
description: Use para cruzar os dados do ciclo trimestral atual com Habitica (atividade concluída ou não) e Toggl Track (tempo gasto), atualizando as colunas de status e duração na aba CICLO TRIMESTRAL.
---

# ciclo-trimestral-sync

Lê as atividades do ciclo trimestral na planilha, consulta o Habitica para verificar conclusão e o Toggl para medir o tempo, e atualiza as colunas correspondentes.

## Estrutura Esperada da Aba CICLO TRIMESTRAL

A skill assume que a aba possui ao menos as seguintes colunas (os índices exatos devem ser confirmados na planilha real):

| Coluna | Campo |
|---|---|
| A | ID da Atividade (ex.: `M01-A02-T03`) |
| B | Categoria |
| C | Meta |
| D | Ação |
| E | Tarefa / "O que foi feito" |
| F | Status Habitica (`✔` / `✘` / vazio) |
| G | Tempo Toggl (em minutos) |
| H | Data de Verificação |

> Se a estrutura da sua planilha for diferente, ajuste os índices de coluna antes de executar.

## Passos de Execução

### 1. Ler as atividades do ciclo atual

```bash
python3 - <<'EOF'
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
creds = service_account.Credentials.from_service_account_file(
    os.environ['GOOGLE_SERVICE_ACCOUNT_JSON'], scopes=SCOPES)
service = build('sheets', 'v4', credentials=creds)

result = service.spreadsheets().values().get(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'CICLO TRIMESTRAL'!A2:E"
).execute()

rows = result.get('values', [])
EOF
```

### 2. Verificar conclusão no Habitica

Para cada atividade da lista, delegar ao specialist:
→ [`specialists/habitica-reader.md`](specialists/habitica-reader.md)

Retorna: `{ "id_atividade": "M01-A02-T03", "concluida": true/false }`

### 3. Verificar tempo no Toggl

Para cada atividade, delegar ao specialist:
→ [`specialists/toggl-reader.md`](specialists/toggl-reader.md)

Retorna: `{ "id_atividade": "M01-A02-T03", "minutos": 45 }`

### 4. Montar batch de atualizações

Construa uma lista de atualizações de célula para as colunas F, G e H:

```python
import datetime

hoje = datetime.date.today().strftime('%d/%m/%Y')
updates = []

for i, row in enumerate(rows, start=2):
    id_ativ = row[0]
    status  = '✔' if habitica_results.get(id_ativ) else '✘'
    tempo   = toggl_results.get(id_ativ, '')
    updates.append({
        'range': f"'CICLO TRIMESTRAL'!F{i}:H{i}",
        'values': [[status, tempo, hoje]]
    })
```

### 5. Gravar na planilha (batch)

```python
service.spreadsheets().values().batchUpdate(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    body={
        'valueInputOption': 'USER_ENTERED',
        'data': updates
    }
).execute()
```

### 6. Exibir resumo ao usuário

```
✔ Ciclo Trimestral atualizado — 17/06/2026
  Atividades verificadas : 12
  Concluídas (Habitica)  : 9 / 12
  Com tempo (Toggl)      : 7 / 12
  Sem registro Toggl     : M01-A01-T02, M02-A03-T01
```

## Tratamento de Erros

| Situação | Ação |
|---|---|
| Atividade não encontrada no Habitica | Marcar como `✘` e registrar no resumo |
| Nenhuma entrada Toggl no período | Deixar coluna G vazia e listar no resumo |
| Erro de autenticação em qualquer API | Interromper e exibir qual credencial falhou |

## Specialists

| Specialist | Responsabilidade |
|---|---|
| [`specialists/habitica-reader.md`](specialists/habitica-reader.md) | Verifica se cada atividade foi concluída no Habitica |
| [`specialists/toggl-reader.md`](specialists/toggl-reader.md) | Soma o tempo registrado no Toggl para cada atividade |
