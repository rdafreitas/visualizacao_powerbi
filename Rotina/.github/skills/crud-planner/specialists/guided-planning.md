# Specialist: guided-planning

Conduz um **planejamento guiado e sequencial**, partindo do bloco de atividades e descendo pela hierarquia Meta → Ação → Tarefa → Ciclo Trimestral.

## Quando usar

Acionar este specialist quando o usuário escolher `[6] Planejamento Guiado` no menu do `crud-planner`.

## Fluxo Completo

### Etapa 1 — Selecionar o Bloco

Buscar o bloco ativo na aba `BLOCOS` e exibir:

```
╔══════════════════════════════════════════╗
║          PLANEJAMENTO GUIADO             ║
╠══════════════════════════════════════════╣
║  Bloco ativo: B03 · Bloco 3 - Junho      ║
║  Período    : 01/06/2026 → 30/06/2026    ║
╚══════════════════════════════════════════╝

Deseja planejar para este bloco?
  [s] Sim
  [n] Escolher outro bloco
```

Se `[n]`, listar todos os blocos com status `Ativo` ou `Planejado` para seleção.

---

### Etapa 2 — Selecionar ou Criar Meta

Listar metas com status `Ativa`:

```
Passo 1/3 — META
─────────────────────────────────────────
A qual Meta esta atividade pertence?

  [1] M01 · Crescer presença digital
  [2] M02 · Desenvolver habilidade X
  [3] M03 · Projeto de conclusão
  [+] Criar nova Meta
```

Se `[+]`, acionar o fluxo de criação do `meta-crud` e retornar aqui com a nova meta selecionada.

---

### Etapa 3 — Selecionar ou Criar Ação

Listar ações ativas da meta selecionada:

```
Passo 2/3 — AÇÃO
─────────────────────────────────────────
Ações de "M01 · Crescer presença digital":

  [1] A01 · Publicar conteúdo semanal
  [2] A02 · Engajar comunidade
  [+] Criar nova Ação nesta Meta
```

Se `[+]`, acionar o fluxo de criação do `acao-crud` (com a meta já pré-selecionada) e retornar aqui com a nova ação selecionada.

---

### Etapa 4 — Selecionar ou Criar Tarefa

Listar tarefas abertas da ação selecionada que ainda não estão no bloco atual:

```
Passo 3/3 — TAREFA
─────────────────────────────────────────
Tarefas de "A01 · Publicar conteúdo semanal":

  [ ] T03 · Escrever post sobre tema X
  [ ] T04 · Criar imagem de capa
  [+] Criar nova Tarefa nesta Ação
```

Permitir seleção múltipla. Se `[+]`, acionar o fluxo de criação do `tarefa-crud` (com a ação já pré-selecionada) e retornar aqui.

> Tarefas já presentes no bloco atual são exibidas marcadas com `[✔]` e não podem ser re-selecionadas.

---

### Etapa 5 — Confirmar e Adicionar ao Ciclo

Exibir resumo antes de gravar:

```
Resumo do planejamento:
  Bloco  : B03 · Bloco 3 - Junho
  Meta   : M01 · Crescer presença digital
  Ação   : A01 · Publicar conteúdo semanal
  Tarefas:
    · T03 · Escrever post sobre tema X
    · T04 · Criar imagem de capa

Confirmar adição ao ciclo?
  [s] Sim
  [c] Cancelar
```

Se confirmado, acionar `ciclo-crud` para gravar as entradas na aba `CICLO TRIMESTRAL`.

---

### Etapa 6 — Continuar ou Encerrar

Após cada ciclo de adição, perguntar:

```
✔ Atividades adicionadas ao bloco com sucesso!

Deseja planejar mais atividades para este bloco?
  [s] Sim — continuar planejando (volta à Etapa 2)
  [m] Mudar de bloco (volta à Etapa 1)
  [n] Não — encerrar planejamento
```

---

### Etapa 7 — Resumo Final

Ao encerrar, exibir o total de atividades planejadas na sessão:

```
╔══════════════════════════════════════════╗
║        PLANEJAMENTO CONCLUÍDO            ║
╠══════════════════════════════════════════╣
║  Bloco  : B03 · Bloco 3 - Junho          ║
║  Total  : 3 tarefa(s) adicionada(s)      ║
╠══════════════════════════════════════════╣
║  · M01-A01-T03 · Escrever post tema X    ║
║  · M01-A01-T04 · Criar imagem de capa    ║
║  · M02-A03-T08 · Estudar módulo 3        ║
╚══════════════════════════════════════════╝
```

## Regras de Negócio

- Não é possível adicionar tarefas ao ciclo cuja Meta ou Ação pai esteja `Pausada` ou `Concluída` — exibir aviso e oferecer a opção de escolher outra ação.
- Se o bloco selecionado estiver com status `Planejado` (não ativo ainda), exibir aviso informativo mas permitir o planejamento.
- Ao criar entidades novas (Meta, Ação ou Tarefa) durante o fluxo guiado, manter o contexto das etapas anteriores já preenchidas — não reiniciar o planejamento.
- O planejamento guiado não substitui o CRUD individual; é um atalho de entrada para o caso de uso mais comum.
