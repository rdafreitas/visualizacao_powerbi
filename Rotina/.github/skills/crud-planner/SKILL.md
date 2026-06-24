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
║  [5] Bloco de Atividades             ║
║  [6] Planejamento Guiado             ║
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
| Bloco de Atividades | [`specialists/bloco-crud.md`](specialists/bloco-crud.md) |
| Planejamento Guiado | [`specialists/guided-planning.md`](specialists/guided-planning.md) |

## Abas Utilizadas na Planilha

| Entidade | Aba |
|---|---|
| Metas | `METAS` |
| Ações | `AÇÕES` |
| Tarefas | `TAREFAS` |
| Ciclo Trimestral | `CICLO TRIMESTRAL` |
| Blocos | `BLOCOS` |

## Fallback: Acesso Direto via Python

Se o servidor MCP `google-sheets` não estiver disponível (sem resposta, erro de conexão ou ferramenta ausente), **não prossiga silenciosamente**. Siga este protocolo:

### 1. Informar a falha e apresentar opções

Exibir ao usuário:

```
╔══════════════════════════════════════════════════════╗
║         ACESSO VIA MCP NÃO DISPONÍVEL                ║
╠══════════════════════════════════════════════════════╣
║  O servidor MCP (mcp-google-sheets) não respondeu.   ║
║                                                      ║
║  Como deseja prosseguir?                             ║
║                                                      ║
║  [1] Usar acesso direto via Python (fallback)        ║
║  [2] Tentar conectar pelo MCP novamente              ║
║  [c] Cancelar operação                               ║
╚══════════════════════════════════════════════════════╝
```

### 2. Roteamento da escolha

| Escolha | Ação |
|---|---|
| `[1]` | Executar `.github/skills/crud-planner/scripts/google_sheets_fallback.py` via Bash |
| `[2]` | Tentar a operação MCP novamente antes de qualquer escrita |
| `[c]` | Cancelar e retornar ao menu principal |

### 3. Executar o script de fallback

```bash
python ".github/skills/crud-planner/scripts/google_sheets_fallback.py"
```

O script importa as funções `conectar()`, `ler_aba()`, `escrever_linha()` e `atualizar_celula()` — use-as diretamente nas operações da skill em vez de chamar a API do MCP.

Variáveis de ambiente necessárias:
- `SERVICE_ACCOUNT_PATH` — caminho para o JSON do Service Account (mesmo usado pelo MCP)
- `GOOGLE_SHEET_ID` — ID da planilha

---

## Regras de Validação Gerais

- IDs são gerados automaticamente no formato `M##`, `A##`, `T##` (ex.: `M03`, `A07`, `T12`).
- Toda Ação deve referenciar uma Meta existente; toda Tarefa deve referenciar uma Ação existente.
- Entradas no Ciclo Trimestral devem referenciar uma Tarefa existente.
- Não é possível excluir uma Meta que tenha Ações associadas sem confirmação explícita.
