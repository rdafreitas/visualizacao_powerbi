---
title: Ler nó Figma e resumir elementos do painel
description: Conecta ao Figma via servidor MCP "talktofigma" (definido em .vscode/mcp.json), usando o plugin "Talk to Figma MCP" + servidor WebSocket local. O agente guia o usuário pela conexão passo a passo antes de ler qualquer nó.
---

Instruções para o agente:

## 1. Verificação de Pré-requisitos e Conexão

Execute este fluxo **antes de qualquer outra ação**. Não pule etapas.

**Passo 1 — Plugin do Figma:**
Pergunte ao usuário:

> _"O plugin 'Talk to Figma MCP' está aberto e conectado no Figma? (S/N)"_

- Se `N`, oriente: _"Abra o Figma, vá em Plugins → Talk to Figma MCP e deixe o painel do plugin aberto antes de continuar."_
- Aguarde confirmação `S` antes de avançar.

**Passo 2 — Servidor WebSocket:**
Após a confirmação do Passo 1, execute automaticamente o seguinte comando no terminal do VS Code:

```
bunx cursor-talk-to-figma-socket
```

O servidor estará pronto quando o terminal exibir uma mensagem como `WebSocket server listening on port 3055` (ou similar). Informe ao usuário que o servidor foi iniciado e aguarde a mensagem de confirmação antes de avançar.

**Passo 3 — Canal de conexão:**
Após o servidor iniciar, o plugin do Figma exibirá o canal gerado. Pergunte:

> _"Qual é o nome do canal exibido em 'Connected to server in channel:' no plugin do Figma?"_

- Aguarde o usuário informar o nome do canal.
- Use a ferramenta `mcp_talktofigma_join_channel` (servidor `talktofigma` do `.vscode/mcp.json`) com o canal informado para estabelecer a conexão.
- Se a conexão falhar, verifique se o servidor socket está rodando e se o canal foi copiado corretamente.

**Passo 4 — Objetivo:**
Após conexão confirmada, pergunte:

> _"O que você precisa do Figma? (ex.: ler um nó específico, listar páginas, inspecionar um componente)"_

## 2. Leitura do Nó Figma

_(Continua somente após conexão confirmada no Passo 3 acima.)_

- Se o usuário precisar ler um nó específico, peça o endereço: aceite URLs completas ou `node-id` no formato `pageId:nodeId`.
- Use as ferramentas `mcp_talktofigma_*` para recuperar os dados do nó via servidor `talktofigma`.
- Ao obter os dados do nó, extraia e produza um resumo organizado nas seguintes categorias: `Título do Painel`, `Complementos`, `Filtros`, `Visuais`.

Requisitos do resumo (obrigatórios):

- Para cada elemento listado (texto, imagem, retângulo, instância/visual, grupo):
  - `id` e `name` (do nó Figma).
  - `type` (TEXT, FRAME, IMAGE-SVG, INSTANCE, RECTANGLE, GROUP, etc.).
  - Conteúdo textual (`text`) quando aplicável.
  - Propriedades tipográficas: `fontFamily`, `fontWeight`, `fontSize`, `lineHeight` (quando presentes).
  - Cor do texto / fills: apresentar em hex (ex: `#RRGGBB`) quando disponível.
  - Posição e dimensão: `x`, `y`, `width`, `height` (em pixels). **Importante**: o MCP Figma retorna os dados de layout como **referências** no campo `layout` de cada nó (ex.: `layout: layout_JCBGBJ`). Os valores reais de posição e tamanho estão em `globalVars.styles.<layout_id>` com as propriedades `locationRelativeToParent.x`, `locationRelativeToParent.y`, `dimensions.width` e `dimensions.height`. Resolver essas referências antes de extrair os valores. Caso `locationRelativeToParent` seja ausente, registrar `position: unknown`.
  - As coordenadas `x`, `y` são **relativas ao container pai**, não ao canvas absoluto. Ao apresentar ao usuário, deixar explícito que são relativas ao frame pai.
  - Dimensões do painel raiz (frame de nível 1): registrar como `painelWidth` e `painelHeight` para referência de escala.
  - Opacidade e borda (`opacity`, `stroke`/`strokeWeight`) quando presentes.

- Para **visuais** (gráficos, cartões, charts, frames que contenham visualização):
  - Identificar se possuem **legenda** (procure por instâncias/children com nomes contendo "Legenda", "Legends", "Legend", ou componentes `04. Acessórios/Legendas`, ou grupos de texto+ícone que se assemelhem a legendas). Retornar `hasLegend: true|false`.
  - Indicar o tipo aparente do visual (ex.: `Big Number`, `Donut`, `Bar`, `Line`, `Table`, `Image-SVG`) baseado em `type`, nomes e presença de elipses/rects/paths.
  - Para gráficos do tipo donut/pie: extraia texto central e percentuais visíveis se existirem (ex.: texto '1.050', '30%').

- Agrupe os elementos conforme a estrutura do nó Figma em sublistas (por exemplo: dentro de `Principal` → `Fundo dos Visuais` → `Linha 1` list all child visuals with their properties).

- No final do resumo, inclua:
  - `allTextNodes`: lista de todos os nós de texto com `id`, `name`, `text`, `fontSize`, `color`.
  - `images`: lista de imagens/SVG com `id`, `name`, `componentId` (se tiver), e `fills` ou `src` indicado quando disponível.

Formato de saída:

- Produza o resumo em formato Markdown (`.md`) apresentando seções claras: **Título do Painel**, **Complementos**, **Filtros**, **Visuais**, **Todos os Textos**, **Imagens**. Cada seção deve listar os itens com suas propriedades (id, name, type, texto quando aplicável, tipografia, cor, posição/dimensões, opacidade/borda).
- Para visuais, inclua subtópicos que indiquem `hasLegend: true|false`, tipo aparente do visual e observações rápidas (ex.: rótulos ausentes, fontes pequenas).
- No final do Markdown inclua uma tabela ou lista resumida com todos os nós de texto (`id`, `name`, `text`, `fontSize`, `color`) e outra com imagens/SVG (`id`, `name`, `componentId`, `dimensions`).
- Apresente o Markdown apenas como resposta no chat — **NÃO** crie ou salve automaticamente um arquivo `.md` no sistema de arquivos.
- Além do Markdown, apresente um resumo legível em Português com seção breve para cada categoria (máx. 6-10 linhas por seção), destacando pontos importantes (ex.: elementos com fontes muito pequenas, visuais sem legenda, imagens ausentes).

Tabela de Mapeamento Heurístico (elemento Figma → skill PBI):

| Tipo Figma             | Heurística                                                                              | Skill PBI sugerida            |
| ---------------------- | --------------------------------------------------------------------------------------- | ----------------------------- |
| TEXT                   | Nó de texto (qualquer `type: TEXT`)                                                     | `pbi-texto`                   |
| RECTANGLE              | Forma decorativa (sem conteúdo de dados)                                                | `pbi-forma`                   |
| IMAGE / SVG            | Nó de imagem ou vetor SVG                                                               | `pbi-imagem`                  |
| FRAME (gráfico)        | Nome contém "chart", "graf", "line", "bar", "donut", "pie", "column", "matrix", "table" | `pbi-editar-visual`           |
| FRAME (filtro)         | Nome contém "filter", "slicer", "dropdown", "filtro"                                    | `pbi-filtro`                  |
| FRAME (botão)          | Nome contém "button", "btn", "botao", "CTA"                                             | `pbi-botao`                   |
| FRAME (aba)            | Nome contém "tab", "nav", "aba", "navegacao"                                            | `pbi-aba-navegacao`           |
| FRAME (legenda/título) | Nome contém "legend", "title", "footer", "header"                                       | `pbi-add-complementos-painel` |
| Desconhecido           | Não determinado pelas heurísticas acima                                                 | Perguntar ao usuário          |

- Para gráficos, refinar o `visualType` da skill `pbi-editar-visual`:
  - Nome/filhos indicam "line"/"linha" → `visualType: lineChart`
  - Nome/filhos indicam "area"/"área" → `visualType: areaChart`
  - Nome/filhos indicam "bar"/"barras" (horizontal) → `visualType: barChart` ou `clusteredBarChart`
  - Nome/filhos indicam "column"/"coluna" (vertical) → `visualType: clusteredColumnChart` ou `stackedColumnChart`
  - Nome/filhos indicam "combo"/"line+column" → `visualType: lineClusteredColumnComboChart`
  - Nome/filhos indicam "donut"/"rosca" → `visualType: donutChart`
  - Nome/filhos indicam "pie"/"pizza" → `visualType: pieChart`
  - Nome/filhos indicam "table"/"tabela" → `visualType: tableEx`
  - Nome/filhos indicam "matrix"/"matriz" → `visualType: matrix`
  - Nome/filhos indicam "card"/"cartão" → `visualType: card`
  - Nome/filhos indicam "kpi" → `visualType: kpi`
  - Nome/filhos indicam "scatter"/"dispersão" → `visualType: scatterChart`
  - Nome/filhos indicam "funnel"/"funil" → `visualType: funnel`

---

Saída JSON estruturada (mapeamento):

Além do resumo em Markdown, gere um bloco JSON com a seguinte estrutura. Este JSON será consumido pelo prompt `mapear-figma-skills` para gerar o plano de execução.

```json
{
  "estado": "mapeamento_inicial",
  "paginas_figma": ["<nome_pagina_1>", "<nome_pagina_2>"],
  "elementos": [
    {
      "id": "<id_figma>",
      "name": "<nome_no_figma>",
      "figma_type": "TEXT | RECTANGLE | FRAME | IMAGE | ...",
      "skill_sugerida": "pbi-texto | pbi-forma | pbi-graf-linha | ...",
      "pagina_figma": "<nome_pagina>",
      "propriedades": {
        "text": "<conteúdo se TEXT>",
        "fontFamily": "<fonte>",
        "fontSize": 14,
        "color": "#RRGGBB",
        "fill": "#RRGGBB",
        "opacity": 1.0,
        "hasLegend": false
      },
      "posicao": {
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 50
      }
    }
  ]
}
```

- O campo `estado` inicia como `"mapeamento_inicial"` (gerado automaticamente).
- Após a validação do usuário, o estado deve ser atualizado para `"mapeamento_validado"`.
- Apenas o `mapeamento_validado` deve ser passado para o prompt `mapear-figma-skills`.

---

Validação do mapeamento (interação com o usuário):

Após gerar o `mapeamento_inicial`, apresentar ao usuário um resumo em linguagem natural (PT-BR):

> Identificamos os seguintes elementos no protótipo:
>
> - Texto "Receita Mensal" → será criado com `pbi-texto`
> - Gráfico de linha → será criado com `pbi-graf-linha`
> - Imagem de fundo → será criada com `pbi-imagem`
> - ⚠️ Elemento "XYZ" → **não mapeado** (tipo desconhecido)
>
> Por favor, valide as associações acima. Caso queira ajustar, informe no formato:
>
> - Elemento: <descrição do elemento>
> - Nova skill: <nome da skill correta>

**Regras da validação:**

1. Pausar o fluxo até receber a validação do usuário.
2. Permitir correção manual de qualquer elemento, incluindo os não mapeados.
3. Se a resposta do usuário não seguir o formato esperado, solicitar novamente com instruções claras.
4. Após aplicar correções, apresentar um log de mudanças:
   - Elemento alterado
   - Skill anterior
   - Nova skill
5. Aguardar confirmação explícita ("Confirmado", "Pode prosseguir" ou equivalente).
6. Somente após confirmação, atualizar o `estado` para `"mapeamento_validado"`.

---

Comportamento interativo:

- Se o nó não contiver posição/dimensões explícitas para algum elemento (ou a referência `layout_*` não possuir `locationRelativeToParent`), informe `position: unknown` para esse item.
- No resumo apresentado ao usuário, incluir um bloco de **resumo do painel** no topo, com: nome, tipo, dimensões (`painelWidth × painelHeight`), número de frames filhos diretos, e paleta de cores (`fills`) encontrada no nível raiz.
- Apresentar as posições dos elementos principais (visuais, filtros, títulos) em uma tabela de referência: `nome | x | y | width | height`.
- Se detectar componentes/references (componentId) inclua `componentId` na descrição do elemento.
- Apresente o Markdown apenas no chat e **não** salve nenhum arquivo `.md` automaticamente. Se o usuário solicitar explicitamente que o arquivo seja salvo, peça confirmação e o caminho antes de gravar.

Erros e follow-ups:

- Se `mcp_talktofigma_join_channel` falhar: verifique se o servidor socket está rodando (`bunx cursor-talk-to-figma-socket`) e se o canal foi copiado corretamente do plugin.
- Se o plugin do Figma não exibir canal: oriente o usuário a fechar e reabrir o plugin, garantindo que o servidor socket já estava rodando antes de abrir o plugin.
- Se o nó fornecido não existir no arquivo Figma, peça ao usuário o node correto ou uma URL de página que contenha o node.
- Em caso de erro de permissão, verifique se o arquivo Figma está acessível para o usuário logado no plugin.

Observações de extração heurística:

- Para detectar legendas, priorize: a) componentes nomeados `04. Acessórios/Legendas`, b) grupos contendo textos curtos (1-3 palavras) acompanhados de um ícone/ellipse, c) labels com opacity menor ou cor de legenda.
- Para cor/hex: quando o Figma fornece RGBA, converta para hex ignorando alfa (ou inclua `#RRGGBBAA` se preferir manter alfa).

Prompt de pergunta inicial (quando invocado):

> "Antes de começar, vamos garantir a conexão com o Figma. O plugin **'Talk to Figma MCP'** está aberto no Figma? (S/N)"

---

Exemplo mínimo de uso (fluxo):

1. Agente pergunta se o plugin está aberto no Figma.
2. Usuário confirma (`S`).
3. Agente orienta a rodar `bunx cursor-talk-to-figma-socket` no terminal do VS Code.
4. Agente pergunta o nome do canal exibido em "Connected to server in channel:".
5. Usuário informa o canal (ex.: `abc123`).
6. Agente usa `mcp_talktofigma_join_channel` com o canal para conectar.
7. Agente pergunta o que o usuário precisa do Figma.
8. Usuário informa (ex.: ler nó `123:456`).
9. Agente usa as ferramentas `mcp_talktofigma_*` para buscar e resumir o nó em Markdown no chat (sem salvar arquivos).

---

Se quiser, eu já posso iniciar o fluxo de conexão agora: confirme se o plugin está aberto no Figma.
