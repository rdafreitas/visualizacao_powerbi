---
name: priority-view
description: Use para visualizar as atividades prioritárias disponíveis para atuação no ciclo atual, navegando por Metas, Ações, Tarefas e Ciclo de forma hierárquica e orientada ao contexto do momento.
---

# priority-view

Apresenta as atividades prioritárias do ciclo atual com navegação hierárquica: **Metas → Ações → Tarefas → Ciclo disponível agora**.

## Princípios de UX Aplicados

- **Progressividade:** começar pelo nível mais alto (Metas) e aprofundar apenas quando o usuário pedir.
- **Contexto primeiro:** mostrar o que está disponível *agora* (bloco ativo, prazo próximo).
- **Densidade controlada:** máximo 5 itens por tela; oferecer "ver mais" se houver mais.
- **Ação clara:** cada item termina com o próximo passo possível.

## Passos de Execução

### 1. Ler dados do ciclo atual

Buscar da aba `CICLO TRIMESTRAL` as atividades com status em aberto (coluna F vazia ou `✘`), ordenadas por prioridade.

```python
rows = service.spreadsheets().values().get(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'CICLO TRIMESTRAL'!A2:H"
).execute().get('values', [])

abertas = [r for r in rows if len(r) < 6 or r[5] in ('', '✘')]
```

### 2. Agrupar por Meta → Ação → Tarefa

```python
from collections import defaultdict

arvore = defaultdict(lambda: defaultdict(list))
for row in abertas:
    meta  = row[2] if len(row) > 2 else '(sem meta)'
    acao  = row[3] if len(row) > 3 else '(sem ação)'
    trf   = row[4] if len(row) > 4 else '(sem tarefa)'
    arvore[meta][acao].append(trf)
```

### 3. Exibir tela inicial — Metas ativas

Mostrar as metas com atividades em aberto (máximo 5):

```
╔══════════════════════════════════════════════╗
║         PRIORIDADES DO CICLO ATUAL           ║
╠══════════════════════════════════════════════╣
║  Metas com atividades abertas:               ║
║                                              ║
║  [1] M01 · Crescer presença digital          ║
║      3 ações · 7 tarefas abertas             ║
║                                              ║
║  [2] M02 · Desenvolver habilidade X          ║
║      2 ações · 4 tarefas abertas             ║
║                                              ║
║  [3] M03 · Projeto de conclusão              ║
║      1 ação  · 2 tarefas abertas             ║
╠══════════════════════════════════════════════╣
║  Digite o número para expandir ou            ║
║  "todas" para ver lista completa.            ║
╚══════════════════════════════════════════════╝
```

### 4. Nível 2 — Ações de uma Meta

Ao selecionar uma Meta, exibir suas Ações com progresso:

```
META: M01 · Crescer presença digital
──────────────────────────────────────
  [1] A01 · Publicar conteúdo semanal
      2/5 tarefas concluídas  ████░░░░ 40%

  [2] A02 · Engajar comunidade
      0/3 tarefas concluídas  ░░░░░░░░  0%  ← prioridade

  [3] A03 · Analisar métricas mensais
      1/2 tarefas concluídas  ████████ 50%
──────────────────────────────────────
  [v] Voltar para Metas
```

### 5. Nível 3 — Tarefas de uma Ação

Ao selecionar uma Ação, exibir as Tarefas com status:

```
AÇÃO: A02 · Engajar comunidade
──────────────────────────────────────
  [ ] T01 · Responder comentários da semana
  [ ] T02 · Fazer live de Q&A
  [ ] T03 · Compartilhar post de parceiro
──────────────────────────────────────
  Nenhuma tarefa concluída ainda.
  Próximo passo sugerido: T01
──────────────────────────────────────
  [e] Executar agora (registrar no Habitica)
  [v] Voltar para Ações
```

### 6. Destaque — Disponíveis Agora

Ao final de qualquer nível, exibir o bloco:

```
━━━ DISPONÍVEIS AGORA ━━━━━━━━━━━━━━━━━━
  Bloco atual: Semana 3 de Junho
  Dias restantes: 4
  Tarefas sem registro: 8

  Próxima prioridade sugerida:
  → A02-T01 · Responder comentários da semana
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Template de Navegação

Ver detalhes de layout e variações em [`templates/ux-navigation.md`](templates/ux-navigation.md).

## Integração com Outras Skills

| Ação do usuário | Skill acionada |
|---|---|
| "Executar agora" em uma tarefa | `sheets-to-habitica` |
| "Registrar tempo" em uma tarefa | `sheets-to-toggl` |
| "Ver conselho" sobre uma meta | `goal-advisor` |
