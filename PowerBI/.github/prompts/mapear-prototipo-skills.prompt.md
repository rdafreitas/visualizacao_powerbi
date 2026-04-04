---
title: Gerar plano de execução ordenado a partir do mapeamento Figma validado
description: Recebe o mapeamento_validado do prompt ler-figma ou ler-painel-excel e gera um plano de execução ordenado com dependências entre skills PBI. Use após validar o mapeamento de elementos para skills Power BI.
agent: pbi-figma-builder
---

Instruções para o agente:

Você recebe como entrada o `mapeamento_validado` (JSON gerado e confirmado pelo prompt `ler-figma`). Seu objetivo é gerar um **plano de execução ordenado** que respeite dependências entre skills.

---

## Regras de ordenação

A ordem de execução deve seguir a lógica de construção do painel:

1. **Página e layout** — Criar a página e aplicar background antes de qualquer visual.
2. **Fonte de dados** — Carregar dados (`pbi-load-csv` ou configuração manual) antes de visuais que dependam de campos/medidas.
3. **Gráficos e visuais de dados** — Criar gráficos via `pbi-editar-visual` (linha, coluna, pizza, rosca, tabela, matriz, entre outros) (dependem de dados carregados).
4. **Filtros** — Criar slicers (dependem de campos existentes no modelo semântico).
5. **Navegação** — Criar abas e botões (dependem da existência de múltiplas páginas ou bookmarks).
6. **Elementos decorativos** — Formas, textos estáticos, imagens (podem ser criados a qualquer momento, mas por convenção ficam após visuais de dados).
7. **Complementos** — Legendas, títulos de seção, rodapés, bordas (`pbi-add-complementos-painel`) — executar por último.

---

## Regras de dependência

Identificar e documentar dependências explícitas e implícitas:

| Dependência                       | Explicação                                                      |
| --------------------------------- | --------------------------------------------------------------- |
| Gráficos → fonte de dados         | Gráficos referenciam colunas/medidas que precisam existir       |
| Filtros → campos no modelo        | Slicers referenciam campos que precisam estar carregados        |
| Navegação → múltiplas páginas     | Botões/abas de navegação precisam de páginas-alvo existentes    |
| Complementos → visuais principais | Legendas e bordas são aplicadas após os visuais que referenciam |
| Layout → página existente         | Background só pode ser aplicado a uma página já criada          |

---

## Formato de saída

Gerar o plano como lista numerada com os seguintes campos por item:

```
## Plano de Execução

| #  | Skill               | Elemento(s)                | Depende de | Observações                        |
| -- | ------------------- | -------------------------- | ---------- | ---------------------------------- |
| 1  | pbi-criar-pagina    | Página "Vendas"            | —          | Criar página base                  |
| 2  | pbi-add-layout      | Background da página       | #1         | Aplicar imagem de layout           |
| 3  | pbi-load-csv        | vendas_ecommerce.csv       | #1         | Carregar dados                     |
| 4  | pbi-editar-visual   | Gráfico "Receita Mensal" (lineChart)  | #3         | Depende dos dados carregados       |
| 5  | pbi-editar-visual   | Gráfico "Categorias" (donutChart)     | #3         | Depende dos dados carregados       |
| 6  | pbi-filtro          | Filtro "Estado"            | #3         | Depende dos campos no modelo       |
| 7  | pbi-botao           | Botão "Análise"            | #1         | Navegação entre páginas            |
| 8  | pbi-texto           | Título "Painel de Vendas"  | #1         | Texto estático decorativo          |
| 9  | pbi-forma           | Barra separadora           | #1         | Forma decorativa                   |
| 10 | pbi-add-complementos| Legenda + rodapé           | #4, #5     | Após visuais que referenciam       |
```

---

## Comportamento

1. **Não alterar** o `mapeamento_validado` — usá-lo como fonte de verdade.
2. **Agrupar por página** quando há múltiplas páginas Figma — gerar um bloco de plano por página.
3. **Marcar itens opcionais** quando o elemento depende de uma skill futura (não disponível) — indicar `⚠️ skill não disponível` e sugerir ação manual.
4. **Identificar itens paralelos** — marcar quais passos poderiam teoricamente ser executados em paralelo (para informação do usuário; o agente executa 1 por vez).
5. Apresentar o plano ao usuário e **aguardar confirmação** antes de retornar.

---

## Exemplo de uso

Entrada: JSON `mapeamento_validado` com 5 elementos (1 texto, 2 gráficos, 1 filtro, 1 imagem).

Saída esperada:

- Tabela com 7+ linhas (página + layout + dados + 2 gráficos + filtro + imagem)
- Dependências claras (`#3` para gráficos que dependem de dados)
- Observações orientando a construção
