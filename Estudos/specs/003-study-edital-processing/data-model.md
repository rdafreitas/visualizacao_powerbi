# Data Model: Study Edital Processing

**Feature**: `003-study-edital-processing` | **Date**: 2026-04-30

> **Por que um data model?** Antes de escrever código, precisamos saber com quais
> "objetos" (dados) o sistema vai trabalhar e como eles se relacionam. Pense nisto
> como o "vocabulário" do sistema — sem ele, cada arquivo inventaria seus próprios nomes
> e o código ficaria inconsistente.

---

## Entidades

### Edital

Representa o documento oficial do concurso, após conversão e extração de dados.

| Campo | Tipo Python | Descrição | Obrigatório | Default quando ausente |
|-------|-------------|-----------|-------------|----------------------|
| `banca` | `str` | Nome da banca organizadora (ex: `"CESPE/CEBRASPE"`) | Sim (invariante) | — |
| `cargo` | `str \| None` | Nome do cargo para o qual o edital se aplica | Não | `null` |
| `numero_vagas` | `int \| None` | Número de vagas abertas | Não | `null` |
| `materias` | `list[MateriaEdital]` | Lista de disciplinas exigidas | Sim (invariante: >= 1) | — |
| `source_pdf` | `str` | Nome do arquivo PDF original (ex: `"edital_trf_2026.pdf"`) | Sim | — |
| `source_hash` | `str` | Hash SHA-256 do PDF (`"sha256:<64 chars>"`) | Sim | — |
| `markdown_path` | `str` | Path relativo do Markdown convertido | Sim | — |

**Invariantes** (condições que DEVEM ser verdadeiras — validadas antes de salvar):
- `banca` não pode ser `None` e não pode ser string vazia
- `len(materias) >= 1` — pelo menos uma matéria deve ter sido extraída

**Regras de validação em `edital_service.py`**:
```python
def validar_invariantes(edital: dict) -> tuple[bool, str]:
    """
    Retorna (True, "") se válido, ou (False, mensagem_de_erro) se inválido.
    Nunca salvar sem passar por esta função.
    """
    if not edital.get("banca"):
        return False, "Campo 'banca' não extraído. Verifique manualmente o edital."
    if not edital.get("materias"):
        return False, "Nenhuma matéria extraída. Verifique manualmente o edital."
    return True, ""
```

---

### MateriaEdital

Representa uma disciplina (matéria) exigida pelo edital para o cargo em questão.

| Campo | Tipo Python | Descrição | Obrigatório | Default quando ausente |
|-------|-------------|-----------|-------------|----------------------|
| `nome` | `str` | Nome da disciplina (ex: `"Direito Constitucional"`) | Sim | — |
| `topicos` | `list[str]` | Lista de tópicos do conteúdo programático | Não | `[]` |
| `peso` | `float \| None` | Peso da matéria na prova (ex: `3.0`) | Não | `null` |
| `numero_questoes` | `int \| None` | Número de questões desta matéria | Não | `null` |

**Notas**:
- `topicos` sendo lista vazia `[]` é diferente de `null` — significa que a matéria foi
  identificada, mas os tópicos não foram extraídos (formato não reconhecido)
- `peso` e `numero_questoes` são ambos marcados `null` quando não encontrados; consumidores
  (spec 005) devem tratar `null` como "peso desconhecido — não penalizar"

---

## Fluxo de Dados (como os dados se movem)

```
PDF (input/editais/)
        │
        ▼
pdf_converter.py (Facade — chama MarkItDown)
        │
        ▼
Markdown (data/editais_md/<nome>.md)
        │
        ▼
edital_extractor.py (Chain of Responsibility)
  ├── EstrategiaTabela        ← tenta primeiro
  ├── EstrategiaBulletList    ← tenta se Tabela falhou
  └── EstrategiaParagrafo     ← tenta se BulletList falhou
        │
        ▼
dict Python (dados extraídos, ainda em memória)
        │
        ▼
edital_service.py (valida invariantes)
  ├── SE válido  ──► edital_repository.py ──► data/edital_parsed.json
  └── SE inválido ──► informa usuário; não salva
        │
        ▼
logs/execution_log.json (spec 002 Foundation)
```

**Legenda**:
- Setas `──►` = fluxo de dados
- `dict Python` = dicionário em memória antes de ser serializado para JSON
- Cada módulo recebe dados do anterior e entrega para o próximo — sem acoplamento direto

---

## Estrutura do `edital_parsed.json` (mapeamento Python → JSON)

```
Edital (Python dict)                    edital_parsed.json
─────────────────────────────────────────────────────────
{                                       {
  # Campos internos de rastreamento       "meta": {
  "source_pdf": "...",          ──►         "feature": "003-study-edital-processing",
  "source_hash": "sha256:...",  ──►         "source_pdf": "...",
  "markdown_path": "...",       ──►         "source_hash": "sha256:...",
                                            "markdown_path": "...",
                                            "created_at": "2026-04-30T...",
                                            "version": "1.0",
                                            "extracao": { ... }
                                          },

  # Dados do edital                      "data": {
  "banca": "CESPE",             ──►         "banca": "CESPE",
  "cargo": "Analista...",       ──►         "cargo": "Analista...",
  "numero_vagas": 50,           ──►         "numero_vagas": 50,
  "materias": [                 ──►         "materias": [
    {                                         {
      "nome": "Direito...",     ──►             "nome": "Direito...",
      "topicos": [...],         ──►             "topicos": [...],
      "peso": null,             ──►             "peso": null,
      "numero_questoes": 20     ──►             "numero_questoes": 20
    }                                         }
  ]                                         ]
}                                         }
                                        }
```

---

## Relacionamento com a Spec 002 (Foundation)

A spec 002 define o contrato de dados que **todos os arquivos JSON do projeto devem seguir**:
todo JSON persistido DEVE ter campos `meta` e `data` no nível raiz.

| Campo obrigatório (spec 002) | Implementação nesta spec |
|------------------------------|--------------------------|
| `meta.feature` | `"003-study-edital-processing"` |
| `meta.created_at` | Timestamp ISO 8601 no momento de salvar |
| `meta.updated_at` | Atualizado a cada reprocessamento |
| `meta.version` | `"1.0"` (incrementar em breaking changes) |
| `data` | Dicionário com `banca`, `cargo`, `materias` |

**Campos adicionais** (não exigidos pela spec 002, mas adicionados por esta spec):
- `meta.source_pdf`, `meta.source_hash`, `meta.markdown_path` — rastreabilidade da origem
- `meta.extracao` — diagnóstico do processo de extração (FR-009)

**Por que isso importa**: As specs 005, 006 e 007 leem `edital_parsed.json`. Se o formato
mudar de forma incompatível (ex: renomear `data.materias` para `data.disciplinas`), essas
specs quebram. O campo `meta.version` permite que consumidores detectem mudanças de contrato.

---

## Entidades de Controle Interno (não persistidas)

Essas entidades existem apenas em memória durante a execução — não aparecem no JSON final.

### ResultadoExtracao

Retornado por cada estratégia no `edital_extractor.py`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sucesso` | `bool` | Se a estratégia conseguiu extrair dados mínimos |
| `estrategia` | `str` | Nome da estratégia usada (`"tabela"`, `"bullet"`, `"paragrafo"`) |
| `dados` | `dict` | Dicionário com os dados extraídos (mesmo formato que `Edital`) |
| `campos_falhos` | `list[str]` | Campos que não puderam ser extraídos |
| `aviso` | `str \| None` | Mensagem descritiva para o log e para o usuário |
