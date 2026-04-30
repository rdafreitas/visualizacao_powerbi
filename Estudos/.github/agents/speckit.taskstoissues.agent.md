---
description: Converte as tarefas existentes em issues do GitHub ordenadas por dependências para a feature, com base nos artefatos de design disponíveis.
tools: ['github/github-mcp-server/issue_write']
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Descrição Geral

1. Execute `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` a partir da raiz do repositório e analise FEATURE_DIR e a lista AVAILABLE_DOCS. Todos os caminhos devem ser absolutos. Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot").
1. A partir do script executado, extraia o caminho para as **tarefas**.
1. Obtenha o remote Git executando:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> PROSSIGA PARA OS PRÓXIMOS PASSOS SOMENTE SE O REMOTE FOR UMA URL DO GITHUB

1. Para cada tarefa na lista, use o servidor MCP do GitHub para criar uma nova issue no repositório que corresponde ao remote Git.

> [!CAUTION]
> SOB NENHUMA CIRCUNSTÂNCIA CRIE ISSUES EM REPOSITÓRIOS QUE NÃO CORRESPONDAM À URL DO REMOTE
