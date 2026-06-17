---
name: crud-planner
description: Use para criar, editar ou atualizar Metas, Ações, Tarefas e entradas do Ciclo Trimestral na planilha. Inclui detecção de duplicatas com confirmação antes de prosseguir.
---

# crud-planner

Gerencia o planejamento na planilha: criação, edição e atualização de **Metas**, **Ações**, **Tarefas** e **Ciclo Trimestral**, com proteção contra duplicatas.

## Hierarquia de Entidades

```
Meta
 └── Ação
      └── Tarefa
           └── Entrada no Ciclo Trimestral
```

Cada entidade tem ID próprio, referência ao nível pai e campos específicos.

## Menu de Seleção de Entidade

Ao acionar a skill, apresentar:

```
╔══════════════════════════════════════╗
║       CRIAR / EDITAR PLANEJAMENTO    ║
╠══════════════════════════════════════╣
║  O que deseja gerenciar?             ║
║                                      ║
║  [1] Meta                            ║
║  [2] Ação                            ║
║  [3] Tarefa                          ║
║  [4] Ciclo Trimestral                ║
║  [v] Voltar ao menu principal        ║
╚══════════════════════════════════════╝
```

## Regra Universal: Detecção de Duplicatas

**Antes de criar qualquer entidade**, buscar registros com nome similar (ignorando maiúsculas/acentos) na aba correspondente.

```python
import unicodedata, re

def normalizar(texto):
    texto = unicodedata.normalize('NFD', texto.lower())
    return re.sub(r'[̀-ͯ]', '', texto)

def detectar_duplicata(nome_novo, lista_existente):
    n = normalizar(nome_novo)
    return [item for item in lista_existente if n in normalizar(item) or normalizar(item) in n]
```

Se encontrar duplicata, exibir:

```
⚠️  Possível duplicata encontrada:
  Existente : "M01 · Crescer presença digital"
  Novo      : "Crescer presença nas redes digitais"

  Deseja:
  [1] Editar o existente
  [2] Criar mesmo assim (são diferentes)
  [c] Cancelar
```

## Roteamento por Entidade

| Escolha | Specialist |
|---|---|
| Meta | [`specialists/meta-crud.md`](specialists/meta-crud.md) |
| Ação | [`specialists/acao-crud.md`](specialists/acao-crud.md) |
| Tarefa | [`specialists/tarefa-crud.md`](specialists/tarefa-crud.md) |
| Ciclo Trimestral | [`specialists/ciclo-crud.md`](specialists/ciclo-crud.md) |

## Abas Utilizadas na Planilha

| Entidade | Aba |
|---|---|
| Metas | `METAS` |
| Ações | `AÇÕES` |
| Tarefas | `TAREFAS` |
| Ciclo Trimestral | `CICLO TRIMESTRAL` |

## Regras de Validação Gerais

- IDs são gerados automaticamente no formato `M##`, `A##`, `T##` (ex.: `M03`, `A07`, `T12`).
- Toda Ação deve referenciar uma Meta existente; toda Tarefa deve referenciar uma Ação existente.
- Entradas no Ciclo Trimestral devem referenciar uma Tarefa existente.
- Não é possível excluir uma Meta que tenha Ações associadas sem confirmação explícita.
