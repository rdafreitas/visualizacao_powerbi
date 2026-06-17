---
name: goal-advisor
description: Use para receber uma análise do desempenho nas metas e ações do ciclo atual, com identificação do que está sendo seguido, do que está atrasado e recomendações práticas de melhoria e motivação.
---

# goal-advisor

Analisa o ciclo trimestral e entrega um relatório personalizado com diagnóstico de desempenho, recomendações e motivação.

## O que a análise cobre

| Dimensão | O que avalia |
|---|---|
| **Em dia** | Metas/ações com ≥ 70% de conclusão no período |
| **Em risco** | Metas/ações com 30–69% de conclusão |
| **Atrasadas** | Metas/ações com < 30% de conclusão |
| **Sem início** | Atividades sem nenhum registro Habitica ou Toggl |
| **Destaques positivos** | As 3 atividades com melhor desempenho consistente |

## Passos de Execução

### 1. Coletar dados do ciclo

Ler da aba `CICLO TRIMESTRAL` as colunas: ID, Meta, Ação, Tarefa, Status Habitica (F), Tempo Toggl (G):

```python
rows = service.spreadsheets().values().get(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'CICLO TRIMESTRAL'!A2:H"
).execute().get('values', [])
```

### 2. Calcular métricas por Meta e Ação

```python
from collections import defaultdict

metricas = defaultdict(lambda: {'total': 0, 'concluidas': 0, 'com_tempo': 0})

for row in rows:
    meta  = row[2] if len(row) > 2 else 'N/A'
    acao  = row[3] if len(row) > 3 else 'N/A'
    chave = f"{meta} > {acao}"
    metricas[chave]['total'] += 1
    if len(row) > 5 and row[5] == '✔':
        metricas[chave]['concluidas'] += 1
    if len(row) > 6 and row[6]:
        metricas[chave]['com_tempo'] += 1

for chave in metricas:
    t = metricas[chave]['total']
    c = metricas[chave]['concluidas']
    metricas[chave]['pct'] = round((c / t) * 100) if t else 0
```

### 3. Classificar e gerar diagnóstico

```python
em_dia     = {k: v for k, v in metricas.items() if v['pct'] >= 70}
em_risco   = {k: v for k, v in metricas.items() if 30 <= v['pct'] < 70}
atrasadas  = {k: v for k, v in metricas.items() if v['pct'] < 30}
sem_inicio = {k: v for k, v in atrasadas.items() if v['concluidas'] == 0}
```

### 4. Montar e exibir relatório

Usar o template de análise (ver [`references/coaching-patterns.md`](references/coaching-patterns.md)):

```
╔══════════════════════════════════════════════════╗
║          ANÁLISE DO CICLO ATUAL                  ║
╠══════════════════════════════════════════════════╣
║  ✅ EM DIA (≥70%)                                ║
║  · M01 > A01 · Publicar conteúdo    — 80%        ║
║  · M03 > A01 · Finalizar projeto    — 75%        ║
╠══════════════════════════════════════════════════╣
║  ⚠️  EM RISCO (30–69%)                           ║
║  · M01 > A02 · Engajar comunidade   — 40%        ║
║    → Faltam 3 tarefas. Reservar 1h esta semana.  ║
╠══════════════════════════════════════════════════╣
║  ❌ ATRASADAS (<30%)                             ║
║  · M02 > A01 · Habilidade X         —  0%        ║
║    → Sem nenhum registro. Redefinir escopo?      ║
╠══════════════════════════════════════════════════╣
║  💡 RECOMENDAÇÕES                                ║
║  1. Priorize M01>A02 antes de novos projetos.    ║
║  2. Revise se M02>A01 ainda é relevante.         ║
║  3. Celebre M01>A01 — consistência em alta!      ║
╚══════════════════════════════════════════════════╝
```

### 5. Perguntar se deseja aprofundar

Após o relatório, oferecer:
```
Deseja:
  [1] Ver detalhes de uma ação específica
  [2] Redefinir prioridade de uma ação atrasada
  [3] Registrar uma reflexão na planilha
  [v] Voltar ao menu principal
```

## Padrões de Recomendação

Ver [`references/coaching-patterns.md`](references/coaching-patterns.md) para repertório de frases motivacionais e estrutura de recomendações por perfil de atraso.

## Integração com Outras Skills

| Ação do usuário | Skill acionada |
|---|---|
| "Redefinir prioridade" | `crud-planner` |
| "Ver detalhes da ação" | `priority-view` |
