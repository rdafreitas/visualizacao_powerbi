---
name: pbi-aba-navegacao
description: Criar/editar uma página de navegação (abas) e o visual de abas que controla mudança de páginas no relatório Power BI.
---

# Skill: pbi-aba-navegacao

## Objetivo
1. Criar ou atualizar um visual de abas/navegação em `definition/pages/<PageName>/visuals/<id>/visual.json` e comportar a navegação entre páginas do relatório.
   - Detalhes:
     - Gerar `visual.json` que define rótulos de abas, mapeamento para páginas destino e comportamento de seleção (single tab active), incluindo estilo e acessibilidade.
     - Atualizar `definition/pages/pages.json` ou `report.json` quando a navegação requer alterações na ordem ou exposição de páginas.
   - Restrições:
     - Não criar páginas novas automaticamente sem confirmação do usuário; a navegação só pode apontar para páginas já existentes ou para páginas que a mesma skill criou explicitamente.

## Panorama (quando usar)
1. Inserir uma barra de navegação por abas para permitir saltos rápidos entre áreas do relatório.
2. Criar navegação superior/inferior em templates ou páginas de índice (landing pages).

## Regras Obrigatórias
1. Verificar que todas as páginas alvo existem; listar páginas ausentes e abortar se necessário.
2. Fazer backup de `pages.json` e de quaisquer `visual.json` alterados.
3. Garantir que a ação de navegação é determinística e não quebra `activePageName` sem confirmação.

## Pontos de decisão
1. Aba aponta para página inexistente:
   - Opções: abortar; sugerir páginas alternativas; ou criar a página de destino (por parâmetro).
2. Nome de aba duplicado ou conflito de estilo:
   - Opções: renomear automaticamente com sufixo, sobrescrever, ou abortar.
3. Deseja que a aba altere o `activePageName` imediatamente ao aplicar a skill:
   - Opções: sim (atualiza activePageName) ou não (aplica sem alterar a página ativa).

## Modelo (entregáveis)
1. `definition/pages/<PageName>/visuals/<id>/visual.json` com configuração das abas e mapeamento de destino.
2. Atualizações em `definition/pages/pages.json` se a ordem/exposição de páginas for alterada.
3. Backups e relatório de execução com lista de abas criadas e páginas mapeadas.

## Saída
Exemplo de saída JSON:

```json
{
  "success": true,
  "pageName": "Teste",
  "visualId": "02_abas",
  "tabs": [
    { "label": "Visão Geral", "targetPage": "Resumo" },
    { "label": "Análise", "targetPage": "Analise" }
  ],
  "filesModified": [
    { "path": "definition/pages/Teste/visuals/02_abas/visual.json", "status": "added" }
  ],
  "warnings": [],
  "errors": []
}
```

---
_Boas práticas:_ expor `--page`, `--id`, `--tabs` (JSON array), `--set-active` e validar destinos antes de aplicar.
