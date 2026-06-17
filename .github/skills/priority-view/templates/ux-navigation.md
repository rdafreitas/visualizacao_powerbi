# Template: ux-navigation

Modelos de tela para cada nível da navegação hierárquica em `priority-view`.

---

## Nível 0 — Sem atividades abertas

```
╔══════════════════════════════════════════════╗
║         PRIORIDADES DO CICLO ATUAL           ║
╠══════════════════════════════════════════════╣
║  Nenhuma atividade em aberto no ciclo atual. ║
║                                              ║
║  Isso pode significar:                       ║
║  · Todas as tarefas foram concluídas! 🎉     ║
║  · O ciclo trimestral ainda não foi          ║
║    preenchido para este bloco.               ║
╠══════════════════════════════════════════════╣
║  [1] Preencher o ciclo agora                 ║
║  [v] Voltar ao menu                          ║
╚══════════════════════════════════════════════╝
```

---

## Nível 1 — Lista de Metas (tela principal)

```
╔══════════════════════════════════════════════╗
║         PRIORIDADES DO CICLO ATUAL           ║
║  Bloco: {NOME_BLOCO}  ·  {DIAS} dias restant.║
╠══════════════════════════════════════════════╣
║  Metas com atividades abertas:               ║
║                                              ║
║  [{N}] {ID} · {NOME_META}                    ║
║       {QTD_ACOES} ações · {QTD_TAREFAS} ab.  ║
║                                              ║
║  (repetir por meta, máx. 5)                  ║
╠══════════════════════════════════════════════╣
║  [+] Ver todas ({TOTAL} metas)               ║
║  [v] Voltar ao menu                          ║
╚══════════════════════════════════════════════╝
```

**Regras de exibição:**
- Ordenar por: mais atrasadas primeiro (menor % de conclusão).
- Limitar a 5 itens; oferecer `[+] Ver todas` se houver mais.

---

## Nível 2 — Ações de uma Meta

```
META: {ID} · {NOME_META}
──────────────────────────────────────────────
  [{N}] {ID_ACAO} · {NOME_ACAO}
       {CONCLUIDAS}/{TOTAL} tarefas  {BARRA}  {PCT}%

  (repetir por ação)
──────────────────────────────────────────────
  💡 Foco sugerido: {ACAO_MENOR_PCT} ({PCT}%)
──────────────────────────────────────────────
  [{N}] Selecionar ação
  [v]   Voltar para Metas
```

**Barra de progresso:** usar blocos `█` e `░`, 8 posições.
Exemplos: `████████ 100%`, `████░░░░  50%`, `░░░░░░░░   0%`

**Regra de foco sugerido:** destacar a ação com menor % de conclusão e mais de 0 tarefas.

---

## Nível 3 — Tarefas de uma Ação

```
AÇÃO: {ID_ACAO} · {NOME_ACAO}
──────────────────────────────────────────────
  [✔] {ID_TAREFA} · {TEXTO_TAREFA}   (concluída)
  [ ] {ID_TAREFA} · {TEXTO_TAREFA}   ← próximo
  [ ] {ID_TAREFA} · {TEXTO_TAREFA}
──────────────────────────────────────────────
  Próximo passo: {PRIMEIRA_TAREFA_ABERTA}
──────────────────────────────────────────────
  [e] Marcar próxima como concluída (Habitica)
  [t] Registrar tempo (Toggl)
  [v] Voltar para Ações
```

---

## Destaque — Disponíveis Agora

Exibir sempre ao fim de qualquer nível:

```
━━━ DISPONÍVEIS AGORA ━━━━━━━━━━━━━━━━━━━━━━━
  Bloco   : {NOME_BLOCO}
  Prazo   : {DATA_FIM}  ({DIAS} dias restantes)
  Abertas : {QTD_ABERTAS} tarefas

  Próxima prioridade sugerida:
  → {ID_TAREFA} · {TEXTO_TAREFA}
    ({META} > {ACAO})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Critério de "próxima prioridade":**
1. Ação com menor % de conclusão.
2. Dentro desta ação, primeira tarefa em aberto.
