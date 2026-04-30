# Research: Study Edital Processing

**Feature**: `003-study-edital-processing` | **Date**: 2026-04-30

---

## 1. MarkItDown — O que é, como instalar e como usar

### O que é o MarkItDown?

O MarkItDown é uma biblioteca Python desenvolvida pela Microsoft que converte documentos
de vários formatos (PDF, DOCX, XLSX, PPTX, HTML, imagens) para texto em formato Markdown.
Para PDFs com texto extraível, ele preserva parágrafos, tabelas e listas de forma que o
texto pode ser processado programaticamente por código Python.

> **Por que Markdown e não texto puro?** O Markdown preserva estrutura — tabelas continuam
> sendo tabelas (`| col1 | col2 |`), listas continuam sendo listas (`- item`), títulos
> continuam sendo títulos (`## Seção`). Isso permite que nossas heurísticas de extração
> usem esses marcadores estruturais para localizar seções do edital.

### Como instalar

```bash
pip install markitdown
```

Verificar instalação:

```python
from markitdown import MarkItDown
md = MarkItDown()
print("MarkItDown instalado com sucesso")
```

### Como usar (exemplo básico)

```python
from markitdown import MarkItDown
from pathlib import Path

def converter_pdf_para_markdown(caminho_pdf: str) -> str:
    """
    Converte um PDF para texto Markdown.
    Retorna o texto Markdown como string.
    Lança FileNotFoundError se o arquivo não existir.
    """
    caminho = Path(caminho_pdf)
    if not caminho.exists():
        raise FileNotFoundError(f"PDF não encontrado: {caminho_pdf}")

    md = MarkItDown()
    resultado = md.convert(str(caminho))
    return resultado.text_content  # Texto Markdown como string
```

### Decisão: Por que MarkItDown e não PyPDF2 ou pdfplumber?

| Critério | MarkItDown | PyPDF2 | pdfplumber |
|----------|-----------|--------|-----------|
| Saída | Markdown estruturado | Texto puro | Texto puro + coordenadas |
| Tabelas | Preserva como tabela Markdown | Perde estrutura | Extrai com coordenadas |
| Listas | Preserva como lista Markdown | Perde marcadores | Perde marcadores |
| Facilidade de uso | `md.convert(path).text_content` | Mais verboso | Mais verboso |
| Escopo de formatos | PDF, DOCX, XLSX, HTML... | Só PDF | Só PDF |
| Mantido por | Microsoft (ativo) | Comunidade | Comunidade |

**Decisão**: MarkItDown foi escolhido porque a saída em Markdown preserva estrutura
(tabelas, listas, títulos) que nossas heurísticas usam diretamente. PyPDF2 e pdfplumber
retornam texto puro — perderíamos a estrutura que precisamos para detectar seções e matérias.

**Limitação conhecida**: MarkItDown não consegue extrair texto de PDFs escaneados (imagens
de documentos). Para esses casos, seria necessário OCR (ex: Tesseract). Esta limitação
está documentada nas Assumptions da spec e na mensagem de erro para o usuário.

---

## 2. Heurísticas de Detecção de Seções em Editais Brasileiros

### O que são heurísticas?

> **Heurística** (do grego "descobrir"): uma regra prática baseada em experiência que
> funciona bem na maioria dos casos, mesmo sem ser matematicamente perfeita. Em vez de
> tentar um algoritmo que funcione 100% dos casos (impossível com a variação de editais),
> usamos regras que funcionam em 80-90% dos casos reais.

### Keywords por tipo de campo

Editais brasileiros usam vocabulário relativamente padronizado por bancas (CESPE, FCC,
VUNESP, IBGE). As keywords abaixo cobrem os padrões mais comuns:

#### Campo: Banca Organizadora

```python
KEYWORDS_BANCA = [
    r"organiza[çc][aã]o",           # "organização: CESPE"
    r"banca\s+organizadora",        # "Banca Organizadora: FCC"
    r"institui[çc][aã]o\s+realizadora", # "Instituição Realizadora"
    r"realiza[çc][aã]o",            # "Realização: VUNESP"
    # Bancas conhecidas (fallback direto)
    r"\b(CESPE|CEBRASPE|FCC|VUNESP|IBGE|ESAF|FGV|CESGRANRIO)\b",
]
```

#### Campo: Cargo

```python
KEYWORDS_CARGO = [
    r"cargo[:\s]",                  # "Cargo: Analista"
    r"fun[çc][aã]o[:\s]",          # "Função: Técnico"
    r"perfil\s+profissional",       # "Perfil Profissional"
    r"denomina[çc][aã]o\s+do\s+cargo",  # "Denominação do Cargo"
]
```

#### Campo: Matérias / Conteúdo Programático

```python
KEYWORDS_MATERIAS = [
    r"conte[uú]do\s+program[aá]tico",  # "Conteúdo Programático"
    r"conhecimentos\s+espec[ií]ficos",  # "Conhecimentos Específicos"
    r"conhecimentos\s+gerais",          # "Conhecimentos Gerais"
    r"programa\s+de\s+prova",          # "Programa de Prova"
    r"disciplinas",                     # "Disciplinas"
    r"mat[eé]rias",                    # "Matérias"
    r"quadro\s+de\s+vagas",            # "Quadro de Vagas" (pesos estão aqui)
    r"provas\s+e\s+crit[eé]rios",     # "Provas e Critérios"
    r"conte[uú]do\s+das\s+provas",    # "Conteúdo das Provas"
]
```

#### Campo: Pesos / Número de Questões

```python
KEYWORDS_PESOS = [
    r"peso[:\s]",                   # "Peso: 3"
    r"n[uú]mero\s+de\s+quest[õo]es", # "Número de Questões"
    r"qtd\.?\s*quest[õo]es",        # "Qtd. Questões"
    r"pontua[çc][aã]o",            # "Pontuação"
    r"valor\s+da\s+prova",         # "Valor da Prova"
]
```

### Estratégia de matching

Todos os patterns usam `re.search(pattern, texto, re.IGNORECASE)` — case-insensitive para
cobrir variações como "CONTEÚDO PROGRAMÁTICO", "Conteúdo Programático", "conteúdo programático".

---

## 3. Estrutura do `edital_parsed.json` (exemplo completo)

```json
{
  "meta": {
    "feature": "003-study-edital-processing",
    "created_at": "2026-04-30T14:30:00",
    "updated_at": "2026-04-30T14:30:00",
    "source_pdf": "edital_trf_2026.pdf",
    "source_hash": "sha256:3a7f2c...",
    "markdown_path": "data/editais_md/edital_trf_2026.md",
    "version": "1.0",
    "extracao": {
      "estrategia_usada": "tabela",
      "campos_extraidos": ["banca", "cargo", "materias"],
      "campos_falhos": ["pesos"],
      "aviso": "Campo 'pesos' não encontrado no edital. Pesos marcados como null."
    }
  },
  "data": {
    "banca": "CESPE/CEBRASPE",
    "cargo": "Analista Judiciário — Área Judiciária",
    "numero_vagas": 50,
    "materias": [
      {
        "nome": "Direito Constitucional",
        "topicos": [
          "Constituição: conceito, objeto, classificações",
          "Princípios fundamentais da República Federativa do Brasil",
          "Direitos e garantias fundamentais",
          "Organização do Estado",
          "Organização dos Poderes"
        ],
        "peso": null,
        "numero_questoes": 20
      },
      {
        "nome": "Direito Administrativo",
        "topicos": [
          "Administração pública: princípios constitucionais",
          "Poderes administrativos",
          "Ato administrativo",
          "Serviços públicos",
          "Responsabilidade civil do Estado"
        ],
        "peso": null,
        "numero_questoes": 20
      },
      {
        "nome": "Língua Portuguesa",
        "topicos": [
          "Compreensão e interpretação de textos",
          "Tipologia textual",
          "Ortografia oficial",
          "Acentuação gráfica",
          "Emprego das classes de palavras"
        ],
        "peso": null,
        "numero_questoes": 10
      }
    ]
  }
}
```

**Notas sobre o schema**:
- `meta.source_hash`: hash SHA-256 do PDF original — permite detectar se o PDF mudou
  e se reprocessamento é necessário
- `meta.extracao`: rastreabilidade completa do processo de extração (qual estratégia
  funcionou, o que falhou) — exigido por FR-009
- `data.materias[].peso`: `null` quando não encontrado (não omitido — FR-008)
- `data.materias[].topicos`: lista de strings com os tópicos do conteúdo programático

---

## 4. Decisão: Por que Chain of Responsibility para extração?

### O problema

Editais brasileiros não seguem um formato único. Um edital do CESPE usa tabelas Markdown;
um da FCC usa bullet lists; um do IBGE usa parágrafos corridos. Precisamos de código que
funcione em todos os casos sem exigir que o usuário saiba o formato do seu edital.

### Alternativas descartadas

| Alternativa | Por que descartada |
|-------------|-------------------|
| `if/elif` por banca | Precisaria mapear todas as bancas; editais da mesma banca variam entre anos |
| Regex único que cobre todos os formatos | Regex muito complexo se torna impossível de manter; falso positivos aumentam |
| Pedir ao usuário que informe o formato | Cria fricção; o usuário iniciante não sabe o que é "formato de tabela Markdown" |
| Só usar IA para extrair | Fora de escopo para esta spec; complexidade desnecessária para dados estruturados |

### Por que Chain of Responsibility é a solução certa

A Cadeia de Responsabilidade permite:

1. **Progressividade**: começa com a estratégia mais precisa (tabelas) e só tenta as mais
   permissivas se necessário — minimiza falsos positivos
2. **Extensibilidade**: adicionar suporte a um novo formato é criar uma nova estratégia e
   inserir na cadeia — sem modificar código existente (Princípio Aberto/Fechado)
3. **Diagnóstico**: cada estratégia reporta se funcionou ou não — os logs mostram qual
   estratégia foi usada, facilitando debugar editais com formatos incomuns
4. **Responsabilidade única**: cada estratégia trata um único formato — código legível,
   testável individualmente

### Ordem da cadeia e justificativa

```
1. EstrategiaTabela      → mais precisa; tabelas têm estrutura clara
2. EstrategiaBulletList  → moderada; listas têm hierarquia implícita
3. EstrategiaParagrafo   → mais tolerante; último recurso; pode gerar mais ruído
```

A ordem é do mais restrito para o mais permissivo — isso minimiza falsos positivos.
Se a estratégia de tabela encontrar uma tabela, ela é mais confiável do que a estratégia
de parágrafo, que pode confundir texto narrativo com conteúdo programático.
