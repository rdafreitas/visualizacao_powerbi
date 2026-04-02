---
title: Ler painel Excel e resumir visuais, títulos, formas e filtros
description: Lê um arquivo Excel (.xlsx) usando openpyxl via terminal Python e gera um resumo organizado de todos os visuais (gráficos), títulos, formas e filtros presentes em uma aba específica. Ao final, confirma com o usuário se o resumo está correto.
---

Instruções para o agente:

## 1. Solicitar informações ao usuário

Execute este fluxo **antes de qualquer outra ação**.

**Passo 1 — Nome do arquivo:**
Se o usuário não informou o nome do arquivo Excel, pergunte:

> _"Qual é o nome do arquivo Excel que deseja analisar? (ex.: vendas_suplementos.xlsx) — informe o nome completo com extensão e, se necessário, o caminho relativo à pasta do projeto."_

Aguarde a resposta antes de continuar.

**Passo 2 — Aba da planilha:**
Após receber o nome do arquivo, pergunte:

> _"Qual é o nome da aba (sheet) que deseja analisar? Caso queira ver todas as abas disponíveis primeiro, apenas diga 'listar abas'."_

- Se o usuário disser **"listar abas"**: execute o script de listagem (seção 2a) e apresente as abas. Depois peça que o usuário escolha uma.
- Caso contrário, use o nome da aba informado diretamente.

---

## 2a. Script — Listar abas disponíveis

Quando solicitado, execute no terminal Python (usando o venv do projeto se existir):

```python
import openpyxl, warnings
warnings.filterwarnings("ignore")
wb = openpyxl.load_workbook("<ARQUIVO>", data_only=True)
print("Abas disponíveis:", wb.sheetnames)
```

Substitua `<ARQUIVO>` pelo caminho informado pelo usuário.

---

## 3. Script — Extrair visuais, títulos, formas e filtros

Após confirmar arquivo e aba, execute o seguinte script no terminal:

```python
import openpyxl, warnings
warnings.filterwarnings("ignore")

ARQUIVO = "<ARQUIVO>"
ABA = "<ABA>"

wb = openpyxl.load_workbook(ARQUIVO, data_only=True)
ws = wb[ABA]

def get_title_text(title):
    try:
        for p in title.tx.rich.p:
            for r in p.r:
                if r.t:
                    return r.t
    except:
        pass
    return "Sem título"

def get_ref(ref_obj):
    try:
        if hasattr(ref_obj, 'numRef') and ref_obj.numRef:
            return ref_obj.numRef.ref
        if hasattr(ref_obj, 'strRef') and ref_obj.strRef:
            return ref_obj.strRef.ref
    except:
        pass
    return "N/D"

# --- Gráficos ---
print(f"\n=== GRÁFICOS ({len(ws._charts)} encontrados) ===")
for i, chart in enumerate(ws._charts):
    title = get_title_text(chart.title) if chart.title else "Sem título"
    tipo = type(chart).__name__.replace("Chart", "")
    try:
        pos = f"col {chart.anchor._from.col+1}, linha {chart.anchor._from.row+1} → col {chart.anchor.to.col+1}, linha {chart.anchor.to.row+1}"
    except:
        pos = "N/D"
    print(f"\nGráfico {i+1}: {title}")
    print(f"  Tipo: {tipo}")
    print(f"  Posição: {pos}")
    for j, serie in enumerate(chart.series):
        val = get_ref(serie.val) if hasattr(serie, 'val') else "N/D"
        cat = get_ref(serie.cat) if hasattr(serie, 'cat') else "N/D"
        print(f"  Série {j+1}: valores={val} | categorias={cat}")

# --- Imagens ---
print(f"\n=== IMAGENS ({len(ws._images)} encontradas) ===")
for i, img in enumerate(ws._images):
    try:
        anc = img.anchor
        pos = f"col {anc._from.col+1}, linha {anc._from.row+1}"
    except:
        pos = "N/D"
    print(f"  Imagem {i+1}: posição={pos}")

# --- Formas / Caixas de texto (SpreadsheetDrawing) ---
try:
    from openpyxl.drawing.spreadsheet_drawing import SpreadsheetDrawing
    drawing = ws._drawing if hasattr(ws, '_drawing') else None
    shapes = []
    if drawing and hasattr(drawing, 'twoCellAnchor'):
        for anc in drawing.twoCellAnchor:
            if anc.sp:
                shapes.append(anc.sp)
    print(f"\n=== FORMAS/CAIXAS DE TEXTO ({len(shapes)} encontradas) ===")
    for i, sp in enumerate(shapes):
        try:
            nome = sp.nvSpPr.cNvPr.name if sp.nvSpPr else "N/D"
        except:
            nome = "N/D"
        try:
            texto = " ".join(r.t for p in sp.txBody.p for r in p.r if r.t) if sp.txBody else ""
        except:
            texto = ""
        print(f"  Forma {i+1}: nome={nome} | texto='{texto}'")
except Exception as e:
    print(f"\n=== FORMAS: não foi possível extrair ({e}) ===")

# --- Filtros automáticos ---
af = ws.auto_filter
print(f"\n=== FILTROS AUTOMÁTICOS ===")
if af and af.ref:
    print(f"  Intervalo com filtro: {af.ref}")
    print(f"  Número de filtros de coluna configurados: {len(af.filterColumn)}")
else:
    print("  Nenhum filtro automático encontrado.")

# --- Tabelas ---
print(f"\n=== TABELAS ({len(ws.tables)} encontradas) ===")
for nome_tabela, tabela in ws.tables.items():
    print(f"  Tabela: {nome_tabela} | Intervalo: {tabela.ref}")

print("\n=== FIM DA EXTRAÇÃO ===")
```

Substitua `<ARQUIVO>` e `<ABA>` pelos valores informados pelo usuário.

---

## 4. Apresentar o resumo ao usuário

Após executar o script, apresente os resultados de forma organizada em Markdown com as seguintes seções:

### Gráficos
Para cada gráfico, informe:
- Título
- Tipo de gráfico (traduzido para PT-BR: Area → Área, Line → Linha, Bar → Barras, Pie → Pizza, Doughnut → Rosca, Scatter → Dispersão, etc.)
- Posição aproximada na planilha
- Fonte dos dados (referências das séries)

### Imagens
Liste as imagens encontradas com posição.

### Formas e Caixas de Texto
Liste formas/shapes com nome e conteúdo de texto, se houver.

### Filtros e Tabelas
Informe o intervalo de filtros automáticos e as tabelas nomeadas com seus intervalos.

---

Tabela de Mapeamento Heurístico (elemento Excel → skill PBI):

| Tipo Excel                 | Heurística                                           | Skill PBI sugerida  |
| -------------------------- | ---------------------------------------------------- | ------------------- |
| Gráfico (LineChart)        | tipo openpyxl contém "Line"                          | `pbi-editar-visual` |
| Gráfico (BarChart)         | tipo openpyxl contém "Bar"                           | `pbi-editar-visual` |
| Gráfico (PieChart)         | tipo openpyxl contém "Pie"                           | `pbi-editar-visual` |
| Gráfico (DoughnutChart)    | tipo openpyxl contém "Doughnut"                      | `pbi-editar-visual` |
| Gráfico (AreaChart)        | tipo openpyxl contém "Area"                          | `pbi-editar-visual` |
| Gráfico (ScatterChart)     | tipo openpyxl contém "Scatter"                       | `pbi-editar-visual` |
| Imagem                     | elemento em `ws._images`                             | `pbi-imagem`        |
| Caixa de texto (com texto) | shape com `txBody` não vazio                         | `pbi-texto`         |
| Forma decorativa           | shape sem conteúdo textual                           | `pbi-forma`         |
| Filtro automático / Tabela | `auto_filter` ou `ws.tables`                         | `pbi-filtro`        |
| Desconhecido               | não determinado pelas heurísticas acima              | Perguntar ao usuário|

- Para gráficos, refinar o `visualType` da skill `pbi-editar-visual`:
  - `LineChart` → `visualType: lineChart`
  - `AreaChart` → `visualType: areaChart`
  - `BarChart` (direção bar/horizontal, `barDir="bar"`) → `visualType: barChart` ou `clusteredBarChart`
  - `BarChart` (direção col/vertical, `barDir="col"`) → `visualType: clusteredColumnChart` ou `stackedColumnChart`
  - `PieChart` → `visualType: pieChart`
  - `DoughnutChart` → `visualType: donutChart`
  - `ScatterChart` → `visualType: scatterChart`
  - Outros tipos sem equivalente direto → perguntar ao usuário

---

Saída JSON estruturada (mapeamento):

Além do Markdown, gere um bloco JSON com a seguinte estrutura. Este JSON será consumido pelo prompt `mapear-prototipo-skills` para gerar o plano de execução.

```json
{
  "estado": "mapeamento_inicial",
  "paginas_excel": ["<nome_da_aba>"],
  "elementos": [
    {
      "id": "<indice_elemento>",
      "name": "<titulo_ou_nome>",
      "excel_type": "LineChart | BarChart | PieChart | DoughnutChart | Image | Shape | Filter | ...",
      "skill_sugerida": "pbi-editar-visual | pbi-imagem | pbi-texto | pbi-forma | pbi-filtro",
      "visual_type": "<visualType_se_grafico>",
      "pagina_excel": "<nome_da_aba>",
      "propriedades": {
        "titulo": "<título do gráfico>",
        "series": ["<ref_serie_1>"],
        "texto": "<conteúdo se shape de texto>"
      },
      "posicao": {
        "col_inicio": 1,
        "linha_inicio": 1,
        "col_fim": 10,
        "linha_fim": 20
      }
    }
  ]
}
```

- O campo `estado` inicia como `"mapeamento_inicial"` (gerado automaticamente).
- Após a validação do usuário, o estado deve ser atualizado para `"mapeamento_validado"`.
- Apenas o `mapeamento_validado` deve ser passado para o prompt `mapear-prototipo-skills`.

---

Validação do mapeamento (interação com o usuário):

Após gerar o `mapeamento_inicial`, apresentar ao usuário um resumo em linguagem natural (PT-BR):

> Identificamos os seguintes elementos no painel Excel:
>
> - Gráfico de linha "Receita Mensal" → será criado com `pbi-editar-visual` (`visualType: lineChart`)
> - Gráfico de rosca "Categorias" → será criado com `pbi-editar-visual` (`visualType: donutChart`)
> - Imagem de fundo → será criada com `pbi-imagem`
> - ⚠️ Elemento "XYZ" → **não mapeado** (tipo desconhecido)
>
> Por favor, valide as associações acima. Caso queira ajustar, informe no formato:
>
> - Elemento: <descrição do elemento>
> - Nova skill: <nome da skill correta>
> - Novo visualType: <visualType correto, se aplicável>

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

## 5. Confirmação com o usuário

Ao final do resumo, gerado no mapeamento inicial, sempre pergunte:

> _"O resumo está correto e completo para o que você precisa? Se precisar de ajustes, me diga o que está faltando ou incorreto. Se quiser uma leitura mais detalhada, também posso processar o arquivo via MarkItDown para extrair o conteúdo textual completo das células."_

- Se o usuário confirmar: encerre o fluxo.
- Se o usuário pedir ajustes: aplique as correções solicitadas, mostre um exemplo de como deve ser feita a mudança (Elemento, Nova skill, Novo visualType) e apresente o resumo atualizado.
- Se o usuário quiser o MarkItDown: execute `markitdown <ARQUIVO>` no terminal e apresente o resultado estruturado.
