# Contrato: edital_parsed.json

**Feature**: `003-study-edital-processing` | **Date**: 2026-04-30

> **O que é um contrato de dados?** É um documento que descreve exatamente o que estará
> em um arquivo JSON — quais campos existem, quais tipos têm, o que significa cada um e o
> que fazer quando um campo está ausente. Com este documento, qualquer spec que leia
> `edital_parsed.json` pode ser implementada sem precisar ler o código de parsing.

**Arquivo**: `/data/edital_parsed.json`
**Produzido por**: `edital_repository.py` (via `edital_service.py`)
**Consumido por**: spec 005 (Relevance Engine), spec 006 (GDoc Publishing), spec 007 (Anki Export)

---

## Schema Completo

```json
{
  "meta": {
    "feature": "003-study-edital-processing",
    "created_at": "2026-04-30T14:30:00",
    "updated_at": "2026-04-30T14:30:00",
    "source_pdf": "edital_trf6_2026.pdf",
    "source_hash": "sha256:3a7f2c9e1b4d8f5a0e2c7b6d9f1a4e8b2c5d7f0a3e6b9c2d5f8a1e4b7c0d3f6",
    "markdown_path": "data/editais_md/edital_trf6_2026.md",
    "version": "1.0",
    "extracao": {
      "estrategia_usada": "tabela",
      "campos_extraidos": ["banca", "cargo", "materias", "numero_questoes"],
      "campos_falhos": ["pesos", "numero_vagas"],
      "aviso": "Campos 'pesos' e 'numero_vagas' não encontrados no edital. Marcados como null."
    }
  },
  "data": {
    "banca": "CESPE/CEBRASPE",
    "cargo": "Analista Judiciário — Área Judiciária",
    "numero_vagas": null,
    "materias": [
      {
        "nome": "Direito Constitucional",
        "topicos": [
          "Constituição: conceito, objeto, classificações e elementos",
          "Princípios fundamentais da República Federativa do Brasil",
          "Aplicabilidade das normas constitucionais",
          "Direitos e garantias fundamentais",
          "Direitos individuais e coletivos",
          "Direitos sociais",
          "Direitos políticos",
          "Organização do Estado",
          "Organização dos Poderes",
          "Funções essenciais à Justiça",
          "Controle de constitucionalidade"
        ],
        "peso": null,
        "numero_questoes": 20
      },
      {
        "nome": "Direito Administrativo",
        "topicos": [
          "Administração pública: princípios constitucionais e infraconstitucionais",
          "Poderes administrativos",
          "Ato administrativo: conceito, requisitos, atributos, classificação e espécies",
          "Serviços públicos: conceito, classificação, regulamentação e formas de prestação",
          "Responsabilidade civil do Estado",
          "Processo administrativo: Lei n.º 9.784/1999",
          "Controle da administração pública",
          "Improbidade administrativa: Lei n.º 8.429/1992"
        ],
        "peso": null,
        "numero_questoes": 20
      },
      {
        "nome": "Língua Portuguesa",
        "topicos": [
          "Compreensão e interpretação de textos de gêneros variados",
          "Reconhecimento de tipos e gêneros textuais",
          "Domínio da ortografia oficial",
          "Domínio dos mecanismos de coesão textual",
          "Emprego das classes de palavras",
          "Relações de coordenação e subordinação",
          "Emprego do sinal indicativo de crase",
          "Concordância verbal e nominal"
        ],
        "peso": null,
        "numero_questoes": 10
      }
    ]
  }
}
```

---

## Descrição de Cada Campo

### Nível `meta`

| Campo | Tipo JSON | Obrigatório | Descrição |
|-------|-----------|-------------|-----------|
| `meta.feature` | `string` | Sim | Identificador desta spec: sempre `"003-study-edital-processing"` |
| `meta.created_at` | `string` (ISO 8601) | Sim | Timestamp da primeira criação do arquivo |
| `meta.updated_at` | `string` (ISO 8601) | Sim | Timestamp da última atualização (reprocessamento) |
| `meta.source_pdf` | `string` | Sim | Nome do arquivo PDF original (sem path completo) |
| `meta.source_hash` | `string` | Sim | Hash SHA-256 do PDF: `"sha256:<64 caracteres hex>"` |
| `meta.markdown_path` | `string` | Sim | Path relativo do Markdown convertido |
| `meta.version` | `string` | Sim | Versão do schema: `"1.0"`. Incrementar em breaking changes |
| `meta.extracao` | `object` | Sim | Diagnóstico do processo de extração (ver abaixo) |

#### Sub-objeto `meta.extracao`

| Campo | Tipo JSON | Obrigatório | Descrição |
|-------|-----------|-------------|-----------|
| `estrategia_usada` | `string` | Sim | `"tabela"`, `"bullet"` ou `"paragrafo"` |
| `campos_extraidos` | `array[string]` | Sim | Campos que foram extraídos com sucesso |
| `campos_falhos` | `array[string]` | Sim | Campos que a extração não encontrou |
| `aviso` | `string \| null` | Não | Mensagem descritiva para o usuário sobre campos falhos |

### Nível `data`

| Campo | Tipo JSON | Obrigatório | Descrição | Valor quando ausente |
|-------|-----------|-------------|-----------|---------------------|
| `data.banca` | `string` | Sim (invariante) | Nome da banca organizadora | N/A — arquivo não salvo sem este campo |
| `data.cargo` | `string \| null` | Não | Nome do cargo processado | `null` |
| `data.numero_vagas` | `integer \| null` | Não | Total de vagas abertas | `null` |
| `data.materias` | `array[object]` | Sim (invariante: >= 1) | Lista de disciplinas exigidas | N/A — arquivo não salvo sem pelo menos 1 |

#### Objeto dentro de `data.materias[]`

| Campo | Tipo JSON | Obrigatório | Descrição | Valor quando ausente |
|-------|-----------|-------------|-----------|---------------------|
| `nome` | `string` | Sim | Nome da disciplina | — |
| `topicos` | `array[string]` | Não | Tópicos do conteúdo programático | `[]` (lista vazia) |
| `peso` | `number \| null` | Não | Peso da matéria na prova (ex: `3.0`) | `null` |
| `numero_questoes` | `integer \| null` | Não | Número de questões desta matéria | `null` |

---

## Interface Pública do `edital_service.py`

> **Por que documentar a interface?** A interface pública é o "contrato de código" — o
> que outras specs podem chamar sem se preocupar com implementação interna. Se a
> implementação mudar, a interface permanece a mesma.

```python
def processar_edital(caminho_pdf: str) -> dict:
    """
    Fluxo completo: converte PDF -> extrai dados -> valida -> salva JSON.

    Parâmetros:
        caminho_pdf (str): Path do PDF em /input/editais/

    Retorna:
        dict com chaves:
          "sucesso": bool
          "mensagem": str  (descrição do resultado para exibir ao usuário)
          "dados": dict | None  (conteúdo de edital_parsed.json, se sucesso)

    Levanta:
        FileNotFoundError: se caminho_pdf não existir
    """

def obter_materias() -> list[dict]:
    """
    Lê edital_parsed.json e retorna a lista de matérias.
    Usado pelas specs 005, 006, 007 para consultar o edital.

    Retorna:
        Lista de dicts, cada um com: nome, topicos, peso, numero_questoes
        Lista vazia [] se edital_parsed.json não existir (sem erro — spec pode prosseguir)

    Nota: Nunca levanta exceção por arquivo ausente — retorna [] com aviso no log.
    """

def edital_existe() -> bool:
    """
    Verifica se /data/edital_parsed.json existe e é válido (tem banca e materias).
    Usado como pré-condição pelas specs dependentes.

    Retorna:
        True se o JSON existe e passa na validação de invariantes
        False caso contrário
    """
```

---

## Heurísticas Documentadas

Esta seção lista exatamente quais keywords são buscadas, em qual ordem, e o que acontece
quando cada uma falha. Serve como referência para debug quando um edital não é extraído
corretamente.

### Sequência de Execução (Chain of Responsibility)

```
Passo 1: EstrategiaTabela
  ├── Busca: padrão de tabela Markdown (linhas com `|`)
  ├── Criteria de sucesso: encontrou pelo menos 1 matéria identificável na tabela
  └── Se falhou → Passo 2

Passo 2: EstrategiaBulletList
  ├── Busca: linhas começando com `- `, `* `, ou `• ` após keyword de seção
  ├── Criteria de sucesso: encontrou pelo menos 1 matéria identificável em lista
  └── Se falhou → Passo 3

Passo 3: EstrategiaParagrafo
  ├── Busca: nomes de matérias conhecidas em qualquer posição no texto
  ├── Criteria de sucesso: encontrou pelo menos 1 matéria conhecida no vocabulário
  └── Se falhou → retorna sucesso=False; edital_service informa usuário
```

### Keywords de Seção (busca case-insensitive)

Estas keywords identificam onde no Markdown começam as seções de matérias:

```python
KEYWORDS_SECAO_MATERIAS = [
    "conteúdo programático",
    "conteudo programatico",      # sem acentos (fallback)
    "conhecimentos específicos",
    "conhecimentos especificos",
    "conhecimentos gerais",
    "programa de prova",
    "disciplinas",
    "matérias",
    "materias",
    "quadro de vagas",
    "provas e critérios",
    "conteúdo das provas",
]
```

### Vocabulário de Matérias Conhecidas (usado pela EstrategiaParagrafo)

A estratégia de parágrafo usa uma lista de matérias comuns em concursos federais para
identificar nomes de disciplinas em texto corrido:

```python
MATERIAS_CONHECIDAS = [
    "Direito Constitucional",
    "Direito Administrativo",
    "Direito Civil",
    "Direito Penal",
    "Direito Processual Civil",
    "Direito Processual Penal",
    "Direito Tributário",
    "Direito do Trabalho",
    "Direito Previdenciário",
    "Língua Portuguesa",
    "Matemática",
    "Raciocínio Lógico",
    "Noções de Informática",
    "Administração Pública",
    "Administração Financeira e Orçamentária",
    "Contabilidade Geral",
    "Contabilidade Pública",
    "Economia",
    "Estatística",
    "Arquivologia",
    "Biblioteconomia",
]
```

### Regras de Normalização de Nomes de Matéria

Para evitar duplicatas quando o edital menciona a mesma matéria com variações de nome:

| Variação encontrada | Nome normalizado |
|--------------------|-----------------|
| `"DIREITO CONSTITUCIONAL"` | `"Direito Constitucional"` |
| `"Dir. Constitucional"` | `"Direito Constitucional"` |
| `"Constituição Federal"` | `"Direito Constitucional"` |
| `"L.P."` | `"Língua Portuguesa"` |
| `"Port."` | `"Língua Portuguesa"` |

Normalização aplicada: `title()` (primeira letra maiúscula por palavra) + mapeamento de
abreviações conhecidas em `extraction_strategies.py`.
