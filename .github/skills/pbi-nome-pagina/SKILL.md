---
name: pbi-nome-pagina
description: Editar o nome de uma página existente em um relatório do Power BI através de um arquivo JSON dentro do arquivo pbip. 
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->
 
# Skill: pbi-nome-pagina

## Objetivo
1. Renomear uma página existente dentro da estrutura exportada de um relatório Power BI (pasta `definition/pages`).
	 - Detalhes:
		 - Localizar o arquivo da página atual (`definition/pages/<OldName>/page.json`) e a referência dessa página em `definition/pages/pages.json` e `definition/report.json` quando aplicável.
		 - Renomear a pasta que contém a página para o novo nome (`<NewName>`), renomear/atualizar o `page.json` interno conforme necessário e ajustar qualquer propriedade `name`/`displayName` dentro do JSON da página.
		 - Atualizar `pages/pages.json` alterando `pageOrder` e `activePageName` para refletir o novo nome quando necessário.
	 - Restrições:
		 - Preservar as propriedades e IDs de visuais e demais objetos na página, a menos que o usuário solicite alterações adicionais.
		 - Garantir que o novo nome não quebre referências internas (ex.: vinculadores de bookmark, ações de navegação) e que seja compatível com o esquema JSON do relatório.

## Panorama (quando usar)
1. Requisições de alteração de nomenclatura por solicitação de produto/design.
2. Padronização de nomes de páginas antes de publicar ou versionar relatórios.
3. Correção de nomes gerados automaticamente que não são legíveis ou que contêm identificadores temporários.
4. Preparação de relatórios para exportação/entrega em que nomes de páginas devem seguir um padrão corporativo.

## Regras Obrigatórias
1. Verificar existência dos arquivos e pastas: `definition/`, `definition/pages/<OldName>/page.json` e `definition/pages/pages.json`.
2. Fazer backup antes de alterar: criar cópias de `pages.json`, `report.json` e do `page.json` afetado.
3. Validar o novo nome: não permitir caracteres inválidos no contexto do JSON ou do sistema de arquivos (ex.: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`).
4. Atualizar todas as referências: `pageOrder`, `activePageName` e quaisquer referências em `report.json` que apontem para o antigo nome.
5. Manter atomicidade: em caso de erro, reverter às versões de backup e reportar o erro com instruções.
6. Idempotência: renomear de `A` → `B` e depois repetir não deve criar entradas duplicadas nem corromper `pages.json`.

## Pontos de decisão
1. Já existe uma pasta com o `NewName`:
	 - Opções: abortar; mesclar (substituir/transferir conteúdos); ou renomear usando sufixo (`NewName-1`). Usuário escolhe.
2. `page.json` contém referências externas (bookmarks, actions) que usam o nome antigo:
	 - Opções: atualizar automaticamente todas as referências detectadas (quando seguro), ou listar manualmente e solicitar confirmação do usuário.
3. `activePageName` aponta para a página sendo renomeada:
	 - Opções: atualizar `activePageName` automaticamente para o novo nome, ou manter o valor antigo e notificar o usuário.
4. Falha na validação de esquema do `page.json` após alterações:
	 - Opções: abortar e reverter; tentar correção mínima (ex.: preencher campos obrigatórios faltantes). Padrão: abortar.

## Modelo (entregáveis da skill)
1. Pastas e arquivos renomeados fisicamente: `definition/pages/<OldName>/` → `definition/pages/<NewName>/`.
2. Arquivo `definition/pages/<NewName>/page.json` com `name` e `displayName` atualizados conforme solicitado.
3. Arquivo `definition/pages/pages.json` atualizado com `pageOrder` e `activePageName` ajustados.
4. Backups dos arquivos originais (ex.: `page.json.bak`, `pages.json.bak`, `report.json.bak`).
5. Relatório de execução com lista de arquivos modificados, decisões e possíveis conflitos detectados.

## Saída
A skill deverá retornar um objeto JSON com o resumo da operação. Exemplo de saída (formato):

```json
{
	"success": true,
	"oldName": "f1a4831a41cd01d25934",
	"newName": "Teste",
	"filesModified": [
		{
			"path": "definition/pages/pages.json",
			"status": "modified",
			"summary": "Atualizado pageOrder e activePageName para 'Teste'"
		},
		{
			"path": "definition/pages/Teste/page.json",
			"status": "added",
			"summary": "Página criada/renomeada com name/displayName atualizados"
		},
		{
			"path": "definition/pages/f1a4831a41cd01d25934/page.json",
			"status": "deleted",
			"summary": "Pasta antiga removida após renomeação"
		}
	],
	"warnings": [],
	"errors": []
}
```

---
_Boas práticas e notas:_
- Executar operações em uma branch/ cópia de trabalho e gerar pull request para revisão.
- Registrar logs detalhados e permitir rollback automático.
- Expor parâmetros controláveis: `--force` para sobrescrever, `--suffix` para criação de nomes alternativos, `--update-active` para atualizar `activePageName`.
