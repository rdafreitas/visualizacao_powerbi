---
name: pbi-criar-pagina
description: Criar uma nova página em um relatório do Power BI editando a estrutura JSON exportada no arquivo PBIP/PBIX.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

# Skill: pbi-criar-pagina

## Objetivo
1. Criar programaticamente uma nova página dentro da estrutura `definition/pages` de um relatório Power BI exportado.
   - Detalhes:
     - Gerar o arquivo de página `definition/pages/<PageName>/page.json` com propriedades mínimas validadas: `name`, `displayName`, `width`, `height`, `displayOption`, e `objects.background` quando for solicitado um layout de background.
     - Atualizar `definition/pages/pages.json` para inserir a nova página em `pageOrder` e, opcionalmente, definir `activePageName` para a nova página.
     - Registrar recursos necessários em `definition/report.json` (ex.: entrada em `RegisteredResources`) quando a nova página referenciar imagens ou outros resources (conforme exemplos nos commits "teste - add layout e ajuste na página" / "teste - salvar pbip").
   - Restrições:
     - Não alterar páginas já existentes além do necessário para manter a consistência (`pageOrder`, `activePageName`); preservar visuais internos e IDs existentes.
     - Validar nomes de página para serem compatíveis com o esquema e com o sistema de arquivos.
     - Garantir que qualquer recurso referenciado (imagem) exista em `StaticResources/RegisteredResources` ou seja criado durante a operação.

## Panorama (quando usar)
1. Criar uma página de template com background de layout (ex.: tela inicial, capa, landing page).
2. Gerar páginas automaticamente durante pipelines de build/embalagem de relatórios.
3. Automatizar a inclusão de páginas de demonstração ou de onboarding antes de publicar relatórios.
4. Inserir páginas que consolidem visualizações estáticas ou imagens de aprovação de design.

## Regras Obrigatórias
1. Verificar existência da estrutura `definition/`, `definition/pages/`, e `definition/report.json` antes de operar.
2. Fazer backup dos arquivos que serão alterados: `pages.json`, `report.json` e quaisquer `page.json` ou resources afetados.
3. Validar o JSON gerado contra o esquema esperado quando possível (schema URI em `pages.json` header).
4. Assegurar idempotência: executar a operação repetidas vezes não deve criar entradas duplicadas (ex.: duplicação de `pageOrder` ou `RegisteredResources`).
5. Garantir permissões de escrita nas pastas alvo; caso contrário, abortar com instruções claras.
6. Gerar logs detalhados e um relatório de execução com todas as alterações aplicadas.

## Pontos de decisão
1. Página com mesmo `name` já existe:
   - Opções: abortar e notificar; sobrescrever (substituir) a página; ou criar uma variação com sufixo (`PageName-1`). Parâmetro do usuário seleciona a ação.
2. Recurso de imagem não existe em `RegisteredResources`:
   - Opções: solicitar upload/criação do resource; tentar localizar em paths alternativos; ou abortar.
3. Deseja tornar a nova página a `activePageName`:
   - Opções: atualizar automaticamente `activePageName` ou manter o valor atual.
4. Falha de validação do JSON/schemas após criação:
   - Opções: reverter alterações e reportar; tentar correção mínima (preencher campos obrigatórios faltantes). Padrão: reverter e reportar.

## Modelo (entregáveis da skill)
1. Pasta e arquivo criados: `definition/pages/<PageName>/page.json` (com propriedades mínimas e, opcionalmente, `objects/background` apontando para `RegisteredResources`).
2. `definition/pages/pages.json` atualizado com a nova `pageOrder` e, se configurado, `activePageName` apontando para `<PageName>`.
3. `definition/report.json` atualizado com entradas em `RegisteredResources` caso a página utilize imagens que precisem ser registradas.
4. Backups dos arquivos originais (`pages.json.bak`, `report.json.bak`, `page.json.bak`), ou rollback automático em caso de falha.
5. Relatório de execução (JSON) com lista de arquivos modificados, decisões tomadas e possíveis conflitos detectados.

## Saída
A skill deverá retornar um objeto JSON resumindo o resultado da operação. Exemplo de saída (formato):

```json
{
  "success": true,
  "pageName": "Teste",
  "pagePath": "definition/pages/Teste/page.json",
  "registeredResources": [
    {
      "name": "Layout02240790626614997.png",
      "path": "definition/StaticResources/RegisteredResources/Layout02240790626614997.png"
    }
  ],
  "filesModified": [
    {
      "path": "definition/pages/pages.json",
      "status": "modified",
      "summary": "Inserido 'Teste' em pageOrder e atualizado activePageName"
    },
    {
      "path": "definition/pages/Teste/page.json",
      "status": "added",
      "summary": "Página criada com background referenciando RegisteredResources"
    },
    {
      "path": "definition/report.json",
      "status": "modified",
      "summary": "Adicionada seção RegisteredResources (imagem Layout0224...)"
    }
  ],
  "warnings": [],
  "errors": []
}
```

---
_Boas práticas:_
- Testar a skill em uma cópia/branch do relatório para revisão via PR.
- Expor parâmetros configuráveis: `--page-name`, `--set-active`, `--background-image`, `--conflict-policy`.
- Registrar um log detalhado e fornecer instruções de rollback automáticas quando aplicável.
