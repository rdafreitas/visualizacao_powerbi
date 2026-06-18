---
name: habitica-upgrade-sync
description: Use para registrar o snapshot diário do Habitica (nível, XP acumulado e ouro acumulado) na aba "Upgrade - Habitica" da planilha Google Sheets. Ideal para executar no início do dia.
---

# habitica-upgrade-sync

Coleta os dados de progresso do Habitica e appenda uma nova linha na aba **"Upgrade - Habitica"** da planilha.

## Estrutura da Aba "Upgrade - Habitica"

| Coluna | Campo | Exemplo |
|---|---|---|
| A | Data da Atualização | `17/06/2026` |
| B | Nível | `42` |
| C | Experiência Total (XP) | `15830` |
| D | Dinheiro (Ouro) | `248.75` |

A aba deve ter cabeçalho na linha 1. Novos dados são sempre adicionados abaixo do último registro.

## Passos de Execução

### 1. Buscar dados do Habitica

```bash
curl -s \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina-habitica-upgrade-sync" \
  "https://habitica.com/api/v3/user" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)['data']['stats']
print(json.dumps({'lvl': d['lvl'], 'exp': round(d['exp'], 2), 'gp': round(d['gp'], 2)}))
"
```

Campos extraídos de `data.stats`:

| Campo JSON | Significado |
|---|---|
| `lvl` | Nível atual do personagem |
| `exp` | Experiência total acumulada |
| `gp` | Ouro (dinheiro) acumulado |

### 2. Autenticar no Google Sheets

Utilize a service account configurada em `GOOGLE_SERVICE_ACCOUNT_JSON`:

```bash
python3 - <<'EOF'
import os, json, datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
creds = service_account.Credentials.from_service_account_file(
    os.environ['GOOGLE_SERVICE_ACCOUNT_JSON'], scopes=SCOPES)
service = build('sheets', 'v4', credentials=creds)
# Continua no próximo passo
EOF
```

### 3. Gravar nova linha na planilha

Append na aba `Upgrade - Habitica`, colunas A–D:

```python
hoje = datetime.date.today().strftime('%d/%m/%Y')
valores = [[hoje, lvl, exp, gp]]

service.spreadsheets().values().append(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'Upgrade - Habitica'!A:D",
    valueInputOption='USER_ENTERED',
    insertDataOption='INSERT_ROWS',
    body={'values': valores}
).execute()
```

### 4. Exibir confirmação ao usuário

```
✔ Habitica sincronizado — 17/06/2026
  Nível : 42
  XP    : 15.830
  Ouro  : 248,75
```

## Tratamento de Erros

| Código / Situação | Ação |
|---|---|
| HTTP 401 (Habitica) | Verificar `HABITICA_USER_ID` e `HABITICA_API_TOKEN` |
| HTTP 403 (Sheets) | Service account não tem permissão de edição na planilha |
| Aba não encontrada | Informar que o nome esperado é exatamente `Upgrade - Habitica` |
| `exp` ou `gp` ausente | Exibir o JSON completo recebido para diagnóstico |

## Referência da API

Ver [`references/habitica-api.md`](references/habitica-api.md) para lista completa de campos e exemplos de resposta.
