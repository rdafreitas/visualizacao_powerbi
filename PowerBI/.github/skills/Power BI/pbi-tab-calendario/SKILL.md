---
name: pbi-tab-calendario
description: Criar uma tabela calendário no modelo semântico do Power BI via Power Query (M), usando o MCP Power BI Modeling Server. Gera colunas de data recomendadas (Ano, Mês, Mês/Ano, OrdemMesAno, Trimestre, Semana, Dia da Semana, etc.) e cria o relacionamento com a tabela de dados selecionada.
---

# Skill: pbi-tab-calendario

## Objetivo

1. Criar uma tabela calendário completa no modelo semântico do relatório Power BI, usando Power Query (M) **exclusivamente via `powerbi-modeling-mcp`**.
   - Detalhes:
     - Gerar as colunas de data recomendadas (ver seção **Colunas Recomendadas**) com tipos, categorias de dados e ordenações corretas.
     - Criar o relacionamento entre `Calendario[Data]` e a coluna de data selecionada na tabela de origem, também via MCP.
   - Restrições:
     - Não alterar tabelas de dados existentes.
     - A tabela calendário usa **somente Power Query (M)** — não usar DAX para calcular tabelas de calendário.
     - Preservar tabelas `DateTableTemplate_*` e `LocalDateTable_*` já existentes (são geradas automaticamente pelo Power BI).

## Panorama (quando usar)

1. Após carregar a fonte de dados (`pbi-load-csv` ou configuração manual) e antes de criar medidas DAX com inteligência de tempo (MTD, YTD, MoM, YoY).
2. Quando o modelo semântico não possui uma tabela de calendário dedicada e o relatório precisa de análises temporais.
3. Para padronizar a hierarquia de datas (Ano → Trimestre → Mês → Dia) em todos os visuais.
4. Sempre que o agente `pbi-figma-builder` detectar gráficos temporais no mapeamento do Figma.

## Fluxo Interativo

### Passo 1 — Perguntar se o usuário quer criar a tabela calendário

> "Deseja criar uma tabela calendário para habilitar análises temporais (MTD, YTD, variação mensal, etc.)?"

- Se **Não**: pular esta skill e registrar no `plano_execucao` que o calendário foi ignorado.
- Se **Sim**: prosseguir com o Passo 2.

### Passo 2 — Identificar a tabela de origem e os campos de data

Listar as tabelas disponíveis no modelo via `powerbi-modeling-mcp`, excluindo `DateTableTemplate_*`, `LocalDateTable_*` e `Medidas`.

> "Qual tabela de dados o calendário irá se conectar? Ex.: `vendas_ecommerce`, `financeiro`."

Após seleção da tabela, listar as colunas dessa tabela que possuem tipo `dateTime` ou `date`:

> "As seguintes colunas de data foram encontradas em `<tabela>`:
>
> - `data_venda` (dateTime)
> - `data_entrega` (dateTime)
>
> Qual dessas colunas será a **chave de relacionamento** com o calendário?"

- Se nenhuma coluna de data for encontrada: alertar o usuário e perguntar o nome da coluna manualmente.
- Armazenar como `coluna_chave_data`.

### Passo 3 — Confirmar período do calendário

> "Qual o período do calendário?
>
> - Data inicial: `<sugerida automaticamente: MIN da coluna_chave_data ou 01/01/2020>`
> - Data final: `<sugerida automaticamente: MAX da coluna_chave_data ou TODAY()>`
>
> Deseja manter o período sugerido ou informar datas específicas?"

- Aceitar `hoje` / `TODAY()` como data final dinâmica.
- Armazenar como `data_inicio` e `data_fim`.

### Passo 4 — Confirmar e executar

Apresentar resumo:

- Tabela: `Calendario`
- Colunas que serão criadas (ver lista abaixo)
- Relacionamento: `Calendario[Data]` → `<tabela>.[<coluna_chave_data>]`
- Período: `<data_inicio>` a `<data_fim>`

Aguardar confirmação explícita antes de salvar.

---

## Colunas Recomendadas

A tabela calendário deve conter as seguintes colunas, na ordem abaixo:

| Coluna            | Tipo     | Categoria de dados   | Expressão M / DAX calculado                                                       | Ordenar por       |
| ----------------- | -------- | -------------------- | --------------------------------------------------------------------------------- | ----------------- |
| `Data`            | dateTime | PaddedDateTableDates | Data base (linha da tabela)                                                       | —                 |
| `Ano`             | int64    | Years                | `Date.Year([Data])`                                                               | —                 |
| `Trimestre`       | string   | QuarterOfYear        | `"T" & Text.From(Date.QuarterOfYear([Data]))`                                     | `NumeroTrimestre` |
| `NumeroTrimestre` | int64    | QuarterOfYear        | `Date.QuarterOfYear([Data])`                                                      | — (oculta)        |
| `Mes`             | string   | Months               | `Date.ToText([Data], "MMMM", "pt-BR")`                                            | `NumeroMes`       |
| `NumeroMes`       | int64    | MonthOfYear          | `Date.Month([Data])`                                                              | — (oculta)        |
| `MesAno`          | string   | —                    | `Date.ToText([Data], "MMM/yyyy", "pt-BR")`                                        | `OrdemMesAno`     |
| `OrdemMesAno`     | int64    | —                    | `Date.Year([Data]) * 100 + Date.Month([Data])`                                    | — (oculta)        |
| `Semana`          | int64    | WeekOfYear           | `Date.WeekOfYear([Data])`                                                         | —                 |
| `DiaSemana`       | string   | DayOfWeek            | `Date.ToText([Data], "dddd", "pt-BR")`                                            | `NumeroDiaSemana` |
| `NumeroDiaSemana` | int64    | DayOfWeek            | `Date.DayOfWeek([Data], Day.Monday) + 1`                                          | — (oculta)        |
| `Dia`             | int64    | DayOfMonth           | `Date.Day([Data])`                                                                | —                 |
| `EFimDeSemana`    | string   | —                    | `if Date.DayOfWeek([Data], Day.Monday) >= 5 then "Fim de semana" else "Dia útil"` | —                 |
| `AnoTrimestre`    | string   | —                    | `Text.From(Date.Year([Data])) & " T" & Text.From(Date.QuarterOfYear([Data]))`     | `OrdemMesAno`     |

**Regras das colunas:**

- `MesAno` é a coluna de exibição nos slicers e eixos de gráficos temporais.
- `OrdemMesAno` (inteiro no formato `YYYYMM`) garante a ordenação correta de `MesAno`.
- Colunas prefixadas com `Numero` ou `Ordem` devem ser **ocultadas** (`isHidden`) no modelo.
- `DiaSemana` usa `Day.Monday` como início da semana (padrão PT-BR).
- Cultura `"pt-BR"` em todos os `Date.ToText` para garantir nomes de meses e dias em português.

---

## Código Power Query (M) de referência

> Fornecer este bloco ao MCP como `source` da partição ao criar a tabela `Calendario`.

```m
let
    /* Use este bloco como referência para o source da tabela Calendario */
    Tabela = #table(0, {})
in
    Tabela
```

<!-- Bloco tmdl completo para referência interna do MCP (não editar manualmente) -->

```tmdl-reference
table Calendario
	lineageTag: <uuid>
	dataCategory: Time

	column Data
		dataType: dateTime
		isKey
		formatString: dd/MM/yyyy
		lineageTag: <uuid>
		dataCategory: PaddedDateTableDates
		summarizeBy: none
		sourceColumn: Data

		annotation SummarizationSetBy = User

	column Ano
		dataType: int64
		formatString: 0
		lineageTag: <uuid>
		dataCategory: Years
		summarizeBy: none
		sourceColumn: Ano

		annotation SummarizationSetBy = User

	column Trimestre
		dataType: string
		lineageTag: <uuid>
		dataCategory: QuarterOfYear
		summarizeBy: none
		sourceColumn: Trimestre
		sortByColumn: NumeroTrimestre

		annotation SummarizationSetBy = User

	column NumeroTrimestre
		dataType: int64
		isHidden
		formatString: 0
		lineageTag: <uuid>
		dataCategory: QuarterOfYear
		summarizeBy: none
		sourceColumn: NumeroTrimestre

		annotation SummarizationSetBy = User

	column Mes
		dataType: string
		lineageTag: <uuid>
		dataCategory: Months
		summarizeBy: none
		sourceColumn: Mes
		sortByColumn: NumeroMes

		annotation SummarizationSetBy = User

	column NumeroMes
		dataType: int64
		isHidden
		formatString: 0
		lineageTag: <uuid>
		dataCategory: MonthOfYear
		summarizeBy: none
		sourceColumn: NumeroMes

		annotation SummarizationSetBy = User

	column MesAno
		dataType: string
		lineageTag: <uuid>
		summarizeBy: none
		sourceColumn: MesAno
		sortByColumn: OrdemMesAno

		annotation SummarizationSetBy = User

	column OrdemMesAno
		dataType: int64
		isHidden
		formatString: 0
		lineageTag: <uuid>
		summarizeBy: none
		sourceColumn: OrdemMesAno

		annotation SummarizationSetBy = User

	column Semana
		dataType: int64
		formatString: 0
		lineageTag: <uuid>
		dataCategory: WeekOfYear
		summarizeBy: none
		sourceColumn: Semana

		annotation SummarizationSetBy = User

	column DiaSemana
		dataType: string
		lineageTag: <uuid>
		dataCategory: DayOfWeek
		summarizeBy: none
		sourceColumn: DiaSemana
		sortByColumn: NumeroDiaSemana

		annotation SummarizationSetBy = User

	column NumeroDiaSemana
		dataType: int64
		isHidden
		formatString: 0
		lineageTag: <uuid>
		dataCategory: DayOfWeek
		summarizeBy: none
		sourceColumn: NumeroDiaSemana

		annotation SummarizationSetBy = User

	column Dia
		dataType: int64
		formatString: 0
		lineageTag: <uuid>
		dataCategory: DayOfMonth
		summarizeBy: none
		sourceColumn: Dia

		annotation SummarizationSetBy = User

	column EFimDeSemana
		dataType: string
		lineageTag: <uuid>
		summarizeBy: none
		sourceColumn: EFimDeSemana

		annotation SummarizationSetBy = User

	column AnoTrimestre
		dataType: string
		lineageTag: <uuid>
		summarizeBy: none
		sourceColumn: AnoTrimestre

		annotation SummarizationSetBy = User

	partition Calendario = m
		mode: import
		source =
				let
				    DataInicio = #date(<ANO_INICIO>, <MES_INICIO>, <DIA_INICIO>),
				    DataFim = Date.From(DateTime.LocalNow()),
				    TotalDias = Duration.Days(DataFim - DataInicio) + 1,
				    ListaDatas = List.Dates(DataInicio, TotalDias, #duration(1, 0, 0, 0)),
				    Tabela = Table.FromList(ListaDatas, Splitter.SplitByNothing(), {"Data"}),
				    TipoData = Table.TransformColumnTypes(Tabela, {{"Data", type date}}),
				    AddAno = Table.AddColumn(TipoData, "Ano", each Date.Year([Data]), Int64.Type),
				    AddNumeroTrimestre = Table.AddColumn(AddAno, "NumeroTrimestre", each Date.QuarterOfYear([Data]), Int64.Type),
				    AddTrimestre = Table.AddColumn(AddNumeroTrimestre, "Trimestre", each "T" & Text.From([NumeroTrimestre]), type text),
				    AddNumeroMes = Table.AddColumn(AddTrimestre, "NumeroMes", each Date.Month([Data]), Int64.Type),
				    AddMes = Table.AddColumn(AddNumeroMes, "Mes", each Date.ToText([Data], "MMMM", "pt-BR"), type text),
				    AddOrdemMesAno = Table.AddColumn(AddMes, "OrdemMesAno", each [Ano] * 100 + [NumeroMes], Int64.Type),
				    AddMesAno = Table.AddColumn(AddOrdemMesAno, "MesAno", each Date.ToText([Data], "MMM/yyyy", "pt-BR"), type text),
				    AddSemana = Table.AddColumn(AddMesAno, "Semana", each Date.WeekOfYear([Data]), Int64.Type),
				    AddNumeroDiaSemana = Table.AddColumn(AddSemana, "NumeroDiaSemana", each Date.DayOfWeek([Data], Day.Monday) + 1, Int64.Type),
				    AddDiaSemana = Table.AddColumn(AddNumeroDiaSemana, "DiaSemana", each Date.ToText([Data], "dddd", "pt-BR"), type text),
				    AddDia = Table.AddColumn(AddDiaSemana, "Dia", each Date.Day([Data]), Int64.Type),
				    AddEFimDeSemana = Table.AddColumn(AddDia, "EFimDeSemana", each if Date.DayOfWeek([Data], Day.Monday) >= 5 then "Fim de semana" else "Dia útil", type text),
				    AddAnoTrimestre = Table.AddColumn(AddEFimDeSemana, "AnoTrimestre", each Text.From([Ano]) & " T" & Text.From([NumeroTrimestre]), type text),
				    TipoFinal = Table.TransformColumnTypes(AddAnoTrimestre, {{"Data", type datetime}})
				in
				    TipoFinal

	annotation PBI_ResultType = Table
```

**Substituições obrigatórias antes de salvar:**

- `<ANO_INICIO>`, `<MES_INICIO>`, `<DIA_INICIO>` → valores definidos pelo usuário no Passo 3 (ex.: `2020`, `1`, `1`).
- Se a data final for dinâmica (TODAY), manter `Date.From(DateTime.LocalNow())`.
- Se a data final for fixa, substituir por `#date(<ANO_FIM>, <MES_FIM>, <DIA_FIM>)`.
- Gerar UUIDs únicos para todos os `lineageTag`.

---

## Regras Obrigatórias

1. Usar **exclusivamente `powerbi-modeling-mcp`** para criar/atualizar a tabela. Se o MCP não estiver disponível ou o Power BI Desktop não estiver aberto, **abortar** e orientar o usuário a verificar a conexão (ver Ponto de decisão 5).
2. Verificar via MCP se a tabela `Calendario` já existe antes de criar.
3. O MCP gerencia automaticamente as referências internas do modelo (`ref table`, relacionamentos e partições). Não editar arquivos `.tmdl` manualmente.
4. Definir `dataCategory: Time` na tabela para que o Power BI reconheça como tabela de data.
5. A coluna `Data` deve ter `isKey` para marcar como chave primária da tabela calendário.
6. Colunas ocultas (`isHidden`) não devem aparecer nos painéis de campos, mas estão disponíveis para ordenação e medidas.
7. Não criar tabela calendário duplicada — verificar se já existe `Calendario.tmdl` antes de executar.
8. Todos os nomes de meses e dias de semana devem usar cultura `"pt-BR"`.

---

## Pontos de decisão

1. **Tabela `Calendario` já existe:**
   - Opções: atualizar período (default), recriar do zero (com confirmação), ou pular.

2. **Nenhuma coluna de data encontrada na tabela de origem:**
   - Opções: o usuário informa o nome da coluna manualmente, ou abortar.

3. **Data inicial/final não informadas:**
   - Ação padrão: sugerir `01/01/2020` como início e `TODAY()` como fim. Confirmar com o usuário.

4. **Relacionamento com coluna que já tem relacionamento (LocalDateTable):**
   - Informar o usuário que já existe um relacionamento automático com `LocalDateTable_*`.
   - Perguntar se deseja manter ambos ou substituir pelo relacionamento com `Calendario`.

5. **`powerbi-modeling-mcp` indisponível ou Power BI Desktop fechado:**
   - **Abortar a skill.** Orientar o usuário a:
     1. Abrir o arquivo `.pbip` no Power BI Desktop.
     2. Verificar se a extensão `powerbi-modeling-mcp` está instalada e conectada no VS Code.
     3. Reiniciar a sessão do agente e executar a skill novamente.
   - Não gerar nem editar arquivos `.tmdl` como contorno.

---

## Modelo (entregáveis)

1. Tabela `Calendario` criada no modelo semântico via `powerbi-modeling-mcp`, com 14 colunas, `dataCategory: Time` e `Data` marcada como `isKey`.
2. Relacionamento criado via MCP: `Calendario[Data]` → `<tabela>.[<coluna_chave_data>]` com `joinOnDateBehavior: datePartOnly`.
3. Relatório de execução com colunas criadas, período e relacionamento definido.

---

## Saída (exemplo JSON)

```json
{
  "success": true,
  "tabelaOrigem": "vendas_ecommerce",
  "colunaChave": "data_venda",
  "periodo": { "inicio": "2020-01-01", "fim": "TODAY()" },
  "colunasCriadas": [
    "Data",
    "Ano",
    "Trimestre",
    "NumeroTrimestre",
    "Mes",
    "NumeroMes",
    "MesAno",
    "OrdemMesAno",
    "Semana",
    "DiaSemana",
    "NumeroDiaSemana",
    "Dia",
    "EFimDeSemana",
    "AnoTrimestre"
  ],
  "colunasOcultas": [
    "NumeroTrimestre",
    "NumeroMes",
    "OrdemMesAno",
    "NumeroDiaSemana"
  ],
  "relacionamento": {
    "de": "vendas_ecommerce.data_venda",
    "para": "Calendario.Data",
    "tipo": "datePartOnly"
  },
  "mcpOperations": [
    { "op": "create_table", "name": "Calendario", "status": "success" },
    {
      "op": "create_relationship",
      "from": "vendas_ecommerce.data_venda",
      "to": "Calendario.Data",
      "status": "success"
    }
  ],
  "warnings": [],
  "errors": []
}
```

_Boas práticas:_ expor parâmetros `--tabela-origem`, `--coluna-data`, `--data-inicio`, `--data-fim`, `--force`.
