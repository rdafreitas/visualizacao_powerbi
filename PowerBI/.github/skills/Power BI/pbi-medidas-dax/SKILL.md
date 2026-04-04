---
name: pbi-medidas-dax
description: Criar medidas DAX no modelo semântico do Power BI usando o MCP Power BI Modeling Server. Cria a tabela "Medidas", organiza as medidas em pastas temáticas numeradas (00. Principal, 01. Tema X...) e interage com o usuário para definir estrutura e escopo.
---

# Skill: pbi-medidas-dax

## Objetivo

1. Criar e organizar medidas DAX na tabela `Medidas` do modelo semântico Power BI, usando o MCP `powerbi-modeling-mcp` para aplicar as alterações diretamente no painel aberto.
   - Detalhes:
     - Criar (ou reutilizar) a tabela `Medidas` em `*.SemanticModel/definition/tables/Medidas.tmdl`, seguindo a estrutura de partição vazia padrão do Power BI.
     - Organizar as medidas em **pastas temáticas** (`displayFolder`) numeradas de `00` a `99`, no formato `NN. Nome do Tema` (ex.: `00. Principal`, `01. Financeiro`, `02. Comercial`).
     - Sugerir medidas pré-definidas com base nas colunas da tabela de origem identificada, ou criar as medidas solicitadas explicitamente pelo usuário.
     - Interagir com o usuário para definir: base de dados, pastas temáticas, medidas por pasta.
   - Restrições:
     - Não alterar tabelas de dados (ex.: `vendas_ecommerce.tmdl`) — apenas criar/editar `Medidas.tmdl`.
     - Não criar medidas que referenciem colunas inexistentes no modelo.
     - Preservar medidas já existentes na tabela `Medidas` salvo quando explicitamente solicitado.

## Panorama (quando usar)

1. Após carregar uma nova fonte de dados (`pbi-load-csv` ou configuração manual) e antes de construir gráficos que dependem de medidas.
2. Quando o usuário precisa padronizar e organizar o catálogo de medidas de um relatório existente.
3. Para criar medidas financeiras, comerciais, operacionais ou personalizadas de forma estruturada e documentada.
4. Quando solicitado pelo agente `pbi-figma-builder` após a carga de dados (Fase 3 do workflow).

## Fluxo Interativo

O fluxo abaixo deve ser seguido rigorosamente, coletando cada informação antes de prosseguir.

### Passo 1 — Identificar a base de dados

Perguntar ao usuário (ou ler do modelo via MCP):

> "Qual tabela de dados será usada como base para calcular as medidas? Ex.: `vendas_ecommerce`, `financeiro`, `clientes`."

- Listar as tabelas disponíveis no modelo semântico (via `powerbi-modeling-mcp` ou leitura de `*.SemanticModel/definition/tables/`).
- Excluir tabelas de sistema (`DateTableTemplate_*`, `LocalDateTable_*`) e a própria `Medidas`.
- Confirmar a tabela selecionada e listar suas colunas numéricas e de data (base para sugestões).

### Passo 2 — Definir estrutura de pastas

Apresentar ao usuário duas opções:

**Opção A — Usuário define as pastas:**

> "Quantas pastas temáticas deseja criar? Para cada pasta, informe o nome. Ex.:
>
> - `00. Principal`
> - `01. Financeiro`
> - `02. Comercial`"

- Aceitar a lista de pastas fornecida.
- Numerar automaticamente se o usuário não incluir o prefixo (ex.: "Financeiro" → `01. Financeiro`).

**Opção B — Skill define automaticamente:**

- Se o usuário não quiser definir, gerar uma estrutura padrão baseada nas colunas da tabela (ver tabela de sugestões abaixo).
- Apresentar a estrutura gerada para validação antes de prosseguir.

### Passo 3 — Definir medidas por pasta

Para cada pasta, apresentar **sugestões de medidas** baseadas nas colunas disponíveis:

**Opção A — Usuário decide pasta a pasta:**

> "Para a pasta `01. Financeiro`, sugerimos as seguintes medidas. Confirme, remova ou adicione:
>
> - Receita Total (SUM de `valores_venda`)
> - Receita Média (AVERAGE de `valores_venda`)
> - Ticket Médio (DIVIDE de Receita Total / Pedidos Total)"

- O usuário pode confirmar tudo, remover itens ou adicionar medidas customizadas.
- Para medidas customizadas, pedir nome da medida e expressão DAX (ou descrever o cálculo e a skill infere o DAX).

**Opção B — Skill define automaticamente:**

- Gerar todas as medidas sugeridas sem intervenção.
- Após geração, apresentar resumo completo para aprovação antes de salvar.

### Passo 4 — Confirmar e executar

Apresentar o plano completo antes de salvar:

- Lista de pastas e medidas por pasta.
- DAX de cada medida.
- Arquivos que serão criados/modificados.

Aguardar confirmação explícita do usuário antes de aplicar via MCP ou edição de arquivo.

### Passo 5 — Apresentar resumo pós-execução

Após salvar, apresentar:

- Tabela com pasta, nome da medida, DAX e descrição curta.
- Arquivos modificados.
- Próximos passos sugeridos (ex.: usar as medidas nos gráficos).

---

## Sugestões de Medidas por Tipo de Coluna

A skill analisa as colunas da tabela de origem e sugere medidas conforme a tabela abaixo:

| Tipo de coluna                            | Medidas sugeridas                                                 | DAX base                                    |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| **Valor numérico** (ex.: vendas, receita) | Total, Média, Mínimo, Máximo, % sobre total                       | `SUM`, `AVERAGE`, `MIN`, `MAX`, `DIVIDE`    |
| **Contagem** (ex.: pedidos, clientes)     | Total distinto, Total, % sobre total                              | `DISTINCTCOUNT`, `COUNT`, `DIVIDE`          |
| **Data** (ex.: data_venda)                | Vendas MTD, YTD, variação MoM, variação YoY                       | `TOTALMTD`, `TOTALYTD`, `DATEADD`, `DIVIDE` |
| **Texto/Categoria**                       | Contagem de categorias, filtro por categoria (medida condicional) | `DISTINCTCOUNT`, `CALCULATE`, `FILTER`      |

### Estrutura padrão de pastas sugerida (quando usuário não define)

| Pasta            | Medidas típicas incluídas                                           |
| ---------------- | ------------------------------------------------------------------- |
| `00. Principal`  | KPIs principais: Total de vendas/receita, total de clientes/pedidos |
| `01. Financeiro` | Receita, ticket médio, margem (quando disponível)                   |
| `02. Comercial`  | Volume de pedidos, produtos mais vendidos, categorias               |
| `03. Temporal`   | MTD, YTD, variação mensal (MoM), variação anual (YoY)               |
| `04. Clientes`   | Total de clientes únicos, ticket por cliente, frequência            |

> A estrutura é adaptada às colunas da tabela de origem — pastas sem colunas relevantes não são criadas.

---

## Regras Obrigatórias

1. Usar o MCP `powerbi-modeling-mcp` para aplicar medidas diretamente no modelo aberto, quando disponível.
2. Se o MCP não estiver disponível, gerar o arquivo `Medidas.tmdl` com a estrutura correta e instruir o usuário a salvar o PBIP.
3. Fazer backup de `Medidas.tmdl` (se existir) antes de qualquer modificação: `Medidas.tmdl.bak`.
4. Atualizar `model.tmdl` para incluir `ref table Medidas` se a tabela for nova.
5. Cada medida deve ter:
   - Nome entre aspas simples: `'Nome da Medida'`
   - `displayFolder` com o nome da pasta temática
   - `lineageTag` único (UUID v4 gerado aleatoriamente)
6. Não criar medidas com nomes duplicados dentro da mesma tabela.
7. Validar o DAX sintaticamente antes de salvar (quando possível via MCP).
8. Não criar a pasta temática se nenhuma medida for atribuída a ela.

---

## Pontos de decisão

1. **Tabela `Medidas` já existe com medidas:**
   - Opções: adicionar novas medidas preservando as existentes (default), substituir tudo (com confirmação), ou abortar.

2. **Usuário solicita medida com coluna inexistente:**
   - Opções: abortar e listar colunas disponíveis, ou criar a medida com placeholder `[COLUNA_NAO_ENCONTRADA]` e avisar.

3. **Usuário não fornece expressão DAX para medida customizada:**
   - Opções: inferir o DAX a partir da descrição do usuário, ou perguntar a expressão explicitamente.

4. **Pasta temática sem número de prefixo:**
   - Ação padrão: adicionar prefixo automático sequencial (ex.: "Financeiro" → `01. Financeiro`).

5. **MCP `powerbi-modeling-mcp` não disponível:**
   - Gerar o `Medidas.tmdl` no diretório correto e instruir o usuário a reabrir o PBIP no Power BI Desktop para aplicar as mudanças.

---

## Modelo (entregáveis)

1. `*.SemanticModel/definition/tables/Medidas.tmdl` criado ou atualizado com todas as medidas organizadas em pastas.
2. `*.SemanticModel/definition/model.tmdl` atualizado com `ref table Medidas` (quando tabela for nova).
3. Backup `Medidas.tmdl.bak` (quando arquivo existia antes da operação).
4. Relatório de execução com lista de medidas criadas por pasta, DAX e status.

---

## Estrutura do arquivo `Medidas.tmdl`

O arquivo deve seguir exatamente o padrão abaixo (compatível com Power BI Desktop e PBIP):

```tmdl
table Medidas
	lineageTag: <uuid>

	measure 'Nome da Medida' = <expressão DAX>
		displayFolder: 00. Principal
		lineageTag: <uuid>

	measure 'Outra Medida' = DIVIDE([Receita Total], [Pedidos Total])
		displayFolder: 01. Financeiro
		lineageTag: <uuid>

	partition Medidas = m
		mode: import
		source =
				let
				    Fonte = Table.FromRows(Json.Document(Binary.Decompress(Binary.FromText("i44FAA==", BinaryEncoding.Base64), Compression.Deflate)), let _t = ((type nullable text) meta [Serialized.Text = true]) in type table [#"Coluna 1" = _t]),
				    #"Tipo Alterado" = Table.TransformColumnTypes(Fonte,{{"Coluna 1", type text}}),
				    #"Colunas Removidas" = Table.RemoveColumns(#"Tipo Alterado",{"Coluna 1"})
				in
				    #"Colunas Removidas"

	annotation PBI_ResultType = Table
```

> **Importante:** A seção `partition Medidas = m` e `annotation PBI_ResultType = Table` são obrigatórias e devem ser copiadas literalmente — elas criam a tabela vazia de suporte às medidas no Power BI.

---

## Saída (exemplo JSON)

```json
{
  "success": true,
  "tabelaOrigem": "vendas_ecommerce",
  "pastasCreadas": [
    {
      "pasta": "00. Principal",
      "medidas": [
        {
          "nome": "Receita Total",
          "dax": "SUM(vendas_ecommerce[valores_venda])",
          "descricao": "Soma total dos valores de venda"
        },
        {
          "nome": "Pedidos Total",
          "dax": "DISTINCTCOUNT(vendas_ecommerce[id_pedido])",
          "descricao": "Número de pedidos únicos"
        },
        {
          "nome": "Clientes Total",
          "dax": "DISTINCTCOUNT(vendas_ecommerce[ids_cliente])",
          "descricao": "Número de clientes únicos"
        }
      ]
    },
    {
      "pasta": "01. Financeiro",
      "medidas": [
        {
          "nome": "Receita Média",
          "dax": "AVERAGE(vendas_ecommerce[valores_venda])",
          "descricao": "Valor médio por transação"
        },
        {
          "nome": "Ticket Médio",
          "dax": "DIVIDE([Receita Total], [Pedidos Total])",
          "descricao": "Receita média por pedido"
        }
      ]
    },
    {
      "pasta": "02. Temporal",
      "medidas": [
        {
          "nome": "Receita MTD",
          "dax": "TOTALMTD([Receita Total], vendas_ecommerce[data_venda])",
          "descricao": "Receita acumulada no mês corrente"
        },
        {
          "nome": "Receita YTD",
          "dax": "TOTALYTD([Receita Total], vendas_ecommerce[data_venda])",
          "descricao": "Receita acumulada no ano corrente"
        }
      ]
    }
  ],
  "filesModified": [
    {
      "path": "*.SemanticModel/definition/tables/Medidas.tmdl",
      "status": "added"
    },
    {
      "path": "*.SemanticModel/definition/model.tmdl",
      "status": "modified",
      "summary": "Adicionado ref table Medidas"
    }
  ],
  "warnings": [],
  "errors": []
}
```

_Boas práticas:_ expor parâmetros `--tabela-origem`, `--pastas`, `--medidas`, `--usar-mcp`, `--force`.
