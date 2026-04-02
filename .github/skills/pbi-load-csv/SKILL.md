---
name: pbi-load-csv
description: Carregar conjuntos de dados CSV no modelo semântico do relatório Power BI exclusivamente via Power BI Modeling MCP Server (sem manipulação de arquivos PBIP).
---

# Skill: pbi-load-csv

## Objetivo

Importar dados de um arquivo CSV para o modelo semântico do relatório Power BI utilizando **exclusivamente o Power BI Modeling MCP Server** (`powerbi-modeling-mcp`). Nenhum arquivo `.tmdl`, `model.tmdl` ou `relationships.tmdl` será criado ou modificado diretamente — todas as operações são realizadas via MCP Server.

**⚠️ Caminho do CSV**: O caminho completo do arquivo CSV deve ser **sempre confirmado explicitamente pelo usuário** antes de qualquer operação. Nunca assuma o caminho automaticamente, mesmo que haja arquivos na pasta do painel.

## Panorama (quando usar)

1. Ao adicionar uma nova fonte de dados CSV que será consumida pelo relatório.
2. Quando o usuário confirmar qual arquivo CSV deseja carregar (caminho completo obrigatório).
3. Ao preparar o modelo para novos visuais que dependem de campos/colunas específicos.

## Regras Obrigatórias

1. **Confirmar o caminho completo do arquivo CSV** antes de iniciar (ex.: `C:\Projetos\Painel Ecommerce\vendas_ecommerce.csv`). Nunca prosseguir sem essa confirmação.
2. **Usar exclusivamente o Power BI Modeling MCP Server** (`powerbi-modeling-mcp`) para todas as operações. É proibido criar ou modificar arquivos `.tmdl`, `model.tmdl` ou `relationships.tmdl` diretamente.
3. Apresentar os tipos de coluna inferidos ao usuário e aguardar confirmação (string, decimal, inteiro, date, boolean) antes de finalizar.
4. Não sobrescrever tabelas existentes sem confirmação explícita do usuário.
5. Ao concluir, sempre informar: _"✅ Tabela criada via Power BI Modeling MCP Server. Por favor, **salve o arquivo do Power BI** (Ctrl+S) para garantir que as mudanças sejam persistidas."_

## Processo de Execução (via MCP Server)

1. **Confirmar caminho do CSV**: solicitar ao usuário o caminho completo do arquivo. Nunca prosseguir sem este dado.
2. **Verificar acesso ao MCP Server**: garantir que `powerbi-modeling-mcp` está acessível e um painel está aberto.
3. **Criar a tabela via MCP**: usar a operação de criação de tabela do MCP Server, informando o nome da tabela e a expressão Power Query (M) que carrega o CSV pelo caminho confirmado:

   ```m
   let
       Fonte = Csv.Document(
           File.Contents("<caminho_completo_do_csv>"),
           [Delimiter=",", Encoding=1252, QuoteStyle=QuoteStyle.None]
       ),
       CabecalhoPromovido = Table.PromoteHeaders(Fonte, [PromoteAllScalars=true]),
       TiposAlterados = Table.TransformColumnTypes(CabecalhoPromovido, {
           /* lista de colunas e tipos — confirmados com o usuário */
       })
   in
       TiposAlterados
   ```

   - Ajustar `Delimiter` conforme informado pelo usuário (padrão: `,`).
   - Ajustar `Encoding` se necessário (UTF-8 = 65001, Windows-1252 = 1252).

4. **Apresentar schema ao usuário**: listar todas as colunas detectadas e seus tipos inferidos. Aguardar confirmação ou correções antes de finalizar.
5. **Identificar colunas de data**: destacar colunas de tipo Date/DateTime que poderão ser usadas em relacionamentos com a tabela calendário.
6. **Notificar conclusão**: _"✅ Tabela `<NomeTabela>` criada com sucesso via Power BI Modeling MCP Server. Salve o arquivo do Power BI (Ctrl+S)."_

## Pontos de Decisão

1. **Caminho do CSV não informado ou inválido**:
   - Solicitar o caminho completo ao usuário. Nunca prosseguir sem confirmação.
2. **Conflito de nome de tabela já existente**:
   - Perguntar ao usuário: renomear a nova tabela ou sobrescrever a existente (apenas com confirmação explícita).
3. **Incerteza sobre tipos numéricos/decimais**:
   - Apresentar heurística ao usuário e solicitar confirmação antes de aplicar.
4. **CSV com encoding não-padrão ou delimitador diferente de vírgula**:
   - Perguntar ao usuário o encoding (UTF-8, Windows-1252, etc.) e o delimitador (`,`, `;`, `|`, `\t`, etc.).
5. **CSV muito grande (> 100.000 linhas)**:
   - Informar ao usuário e perguntar se deseja prosseguir ou reduzir o arquivo antes de carregar.

## Saída Esperada

Ao concluir, apresentar ao usuário:

- Nome da tabela criada no modelo
- Lista de colunas com tipos detectados/confirmados
- Colunas de data identificadas (para relacionamento futuro com tabela calendário)
- Canal utilizado: **Power BI Modeling MCP Server** (nunca arquivos PBIP)
- Instrução para salvar o arquivo do Power BI (Ctrl+S)
