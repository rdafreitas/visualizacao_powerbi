# Relatório Painel Ecommerce

## Tabelas existentes

- `vendas_ecommerce`
- `DateTableTemplate_b5d6adb6-eb43-49ae-a50b-e75f0da8ea3e` (tabela de data com GUID)
- `LocalDateTable_945f7127-eb81-474c-818a-40571cfa3b55` (tabela de data local com GUID)
- `Medidas` (apenas medidas, sem colunas)

## Propósito da tabela `vendas_ecommerce`

A tabela `vendas_ecommerce` armazena o detalhe de cada transação de venda: identificador do pedido, cliente, data, produto, categoria, quantidades, valores e informações relacionadas como estado e feedback. É a base revenda do modelo e serve para calcular métricas de faturamento e volume.

## Colunas principais

**vendas_ecommerce**
- id_pedido (Int64)
- data_venda (DateTime)
- ids_cliente (Int64)
- idade_cliente (Int64)
- produto (String)
- categoria (String)
- quantidade (Int64)
- valor_unitario (Int64)
- valores_venda (Int64)
- estado (String)
- feedback (String)

**DateTableTemplate...**
- Date (DateTime)
- Ano (Int64, calculada)
- MonthNo (Int64, calculada)
- Mês (String, calculada)
- QuarterNo (Int64, calculada)
- Trimestre (String, calculada)
- Dia (Int64, calculada)

**LocalDateTable...**
- Date (DateTime)
- Ano (Int64, calculada)
- MonthNo (Int64, calculada)
- Mês (String, calculada)
- QuarterNo (Int64, calculada)
- Trimestre (String, calculada)
- Dia (Int64, calculada)

## Medidas e pastas

Todas as medidas residem na tabela `Medidas` dentro da pasta `00. Principal`:

- Receita - Total — soma de `valores_venda`, usada para análise de faturamento.
- Vendas - Total — soma de `valores_venda` (duplicada a Receita neste caso), normalmente representaria quantidade ou valor agregado.
- Receita - Média — média de `valores_venda`, útil para avaliar ticket médio.
- Pedidos - Total — contagem distinta de `id_pedido`, usado para número de transações.
- Clientes - Total — contagem distinta de `ids_cliente`, para dimensionar a base de clientes.

### Objetivo das medidas
Cada medida fornece um agregado-chave que é comumente exibido em cartões, tabelas e gráficos:
- `Receita - Total` e `Vendas - Total` ajudam a monitorar a receita global.
- `Receita - Média` mostra o valor médio por venda.
- `Pedidos - Total` e `Clientes - Total` permitem analisar volume e penetração de mercado.


## Inconsistências de nomenclatura

- Tabelas de data possuem nomes com GUIDs enquanto outras têm nomes limpos.
- Coluna `ids_cliente` está no plural; deveria ser `id_cliente`.
- Mistura de underscores e acentos nos nomes de colunas (`valor_unitario`, `valores_venda`, etc.).
- Medidas usam termos variados e nem todas seguem a mesma ortografia (pontuação/acento).
- Convênio de nomenclatura poderia ser padronizado para `<Item> - <Métrica>`.
