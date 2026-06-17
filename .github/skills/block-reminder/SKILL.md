---
name: block-reminder
description: Use para verificar quantos dias faltam para o fim do bloco atual e receber lembretes de planejamento do próximo bloco. Também pode ser acionado automaticamente em 7, 3 e 1 dia antes do fim do bloco.
---

# block-reminder

Calcula o prazo do bloco de atividades atual e exibe lembretes de planejamento conforme a proximidade do fim.

## Conceito de Bloco

Um **bloco** é o período de atividades dentro do ciclo trimestral (ex.: semanas, quinzenas). A data de início e fim do bloco é lida da planilha.

## Estrutura Esperada da Aba de Blocos

A skill assume uma aba chamada `BLOCOS` (ou equivalente definida pelo usuário) com:

| Coluna | Campo | Exemplo |
|---|---|---|
| A | Nome do Bloco | `Bloco 3 - Junho` |
| B | Data de Início | `10/06/2026` |
| C | Data de Fim | `24/06/2026` |
| D | Status | `Ativo` / `Concluído` |

## Passos de Execução

### 1. Identificar o bloco ativo

```python
import datetime

rows = service.spreadsheets().values().get(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'BLOCOS'!A2:D"
).execute().get('values', [])

hoje = datetime.date.today()
bloco_ativo = None
for row in rows:
    if len(row) >= 4 and row[3] == 'Ativo':
        fim = datetime.datetime.strptime(row[2], '%d/%m/%Y').date()
        bloco_ativo = {'nome': row[0], 'fim': fim}
        break
```

### 2. Calcular dias restantes

```python
if bloco_ativo:
    dias_restantes = (bloco_ativo['fim'] - hoje).days
```

### 3. Selecionar mensagem por proximidade

| Dias restantes | Tipo de lembrete |
|---|---|
| > 7 | Informativo simples |
| 7 | Lembrete de planejamento antecipado |
| 3 | Lembrete de revisão |
| 1 | Alerta final — planejar agora |
| 0 | Bloco encerrado — iniciar novo |
| < 0 | Bloco vencido sem encerramento |

Ver mensagens completas em [`templates/reminder-messages.md`](templates/reminder-messages.md).

### 4. Exibir lembrete

Exemplo para 7 dias restantes:
```
╔══════════════════════════════════════════════╗
║  ⏰ LEMBRETE DE BLOCO                        ║
╠══════════════════════════════════════════════╣
║  Bloco: Bloco 3 - Junho                      ║
║  Término: 24/06/2026  (7 dias restantes)     ║
╠══════════════════════════════════════════════╣
║  É hora de começar a pensar no próximo       ║
║  bloco. Revise o que ficou pendente e        ║
║  defina as prioridades da próxima semana.    ║
╠══════════════════════════════════════════════╣
║  Deseja:                                     ║
║  [1] Ver tarefas abertas deste bloco         ║
║  [2] Planejar o próximo bloco agora          ║
║  [v] Voltar ao menu                          ║
╚══════════════════════════════════════════════╝
```

### 5. Planejamento do próximo bloco (opcional)

Se o usuário escolher planejar, acionar `crud-planner` com contexto de criação de novo bloco e ciclo de atividades.

## Como Configurar Lembretes Automáticos

Para receber lembretes automaticamente nos marcos de 7, 3 e 1 dia, configure um cron job ou agendamento que acione esta skill diariamente:

```bash
# Exemplo: verificar todo dia às 08h00
0 8 * * * claude --skill block-reminder
```

Ou configure via `.github/workflows/` com GitHub Actions.

## Template de Mensagens

Ver [`templates/reminder-messages.md`](templates/reminder-messages.md) para o texto completo de cada tipo de lembrete.
