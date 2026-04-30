# Data Model: Study Summary Generation

**Feature**: `004-study-summary-generation` | **Data**: 2026-04-30

> **Por que um data model?** Antes de escrever código, precisamos saber com quais
> "objetos" (dados) o sistema vai trabalhar e como eles se relacionam. Pense nisto
> como o "vocabulário" do sistema. Quando o vocabulário está claro, o código escreve-se
> quase sozinho.

---

## Entidades

### Topico

Unidade atômica de conhecimento no outline. Pode conter outros `Topico`s como filhos,
formando uma árvore hierárquica.

| Campo | Tipo Python | Descrição | Obrigatório |
|-------|-------------|-----------|-------------|
| `id` | `str` | Identificador hierárquico único (ex: `"t001"`, `"t001.2.1"`) | ✅ |
| `level` | `int` | Nível hierárquico: 0, 1, 2 ou 3 | ✅ |
| `text` | `str` | Texto do nó — inclui marcador (`❖`, `➤`, `■`) para L1/L2/L3 | ✅ |
| `children` | `list[Topico]` | Sub-tópicos filhos (lista vazia `[]` em nós folha) | ✅ |

**Regras de validação**:
- `level` DEVE ser inteiro entre 0 e 3 — nenhum nível além de L3 é permitido
- `text` com `level=2` DEVE ter no máximo 15 palavras (contagem exclui o marcador `➤`)
- Um nó com `level=3` NUNCA tem `children` (L3 é sempre folha)
- O ID `"t001"` é o pai de `"t001.1"`, que é pai de `"t001.1.1"` — a hierarquia de IDs
  reflete a hierarquia de `children`

**Representação Python (dataclass)**:
```python
from dataclasses import dataclass, field

@dataclass
class Topico:
    id: str
    level: int
    text: str
    children: list["Topico"] = field(default_factory=list)
```

---

### Questao

Representa um exercício extraído do material de estudo.

| Campo | Tipo Python | Descrição | Obrigatório |
|-------|-------------|-----------|-------------|
| `id` | `str` | Identificador sequencial (ex: `"q001"`, `"q002"`) | ✅ |
| `enunciado` | `str` | Texto completo da questão | ✅ |
| `alternativas` | `dict[str, str] \| None` | Mapa letra → texto; `None` para dissertativa | Depende do tipo |
| `gabarito` | `str \| None` | Resposta correta (letra ou "Certo"/"Errado"); `None` quando não disponível | Não |
| `tipo` | `str` | `"multipla_escolha"` / `"certo_errado"` / `"dissertativa"` | ✅ |

**Regras de validação**:
- Se `tipo = "multipla_escolha"` → `alternativas` não pode ser `None`
- Se `tipo = "certo_errado"` → `alternativas` é `None` e `gabarito` é `"Certo"` ou `"Errado"`
- Se `tipo = "dissertativa"` → `alternativas` é `None` e `gabarito` é `None`

**Representação Python (dataclass)**:
```python
@dataclass
class Questao:
    id: str
    enunciado: str
    tipo: str
    alternativas: dict[str, str] | None = None
    gabarito: str | None = None
```

---

### Outline

Coleção de `Topico`s no nível raiz (L0), que contém toda a hierarquia de um material.
O `Outline` é o que o `OutlineBuilder` constrói e o `TopicRepository` persiste.

| Campo | Tipo Python | Descrição |
|-------|-------------|-----------|
| `topicos` | `list[Topico]` | Lista de nós L0 — cada um com seus `children` aninhados |
| `texto_formatado` | `str` | Representação textual pronta para `_topicos.txt` |
| `total_nos` | `int` | Contagem total de nós em todos os níveis (para log) |

**Representação Python**:
```python
@dataclass
class Outline:
    topicos: list[Topico] = field(default_factory=list)
    texto_formatado: str = ""
    total_nos: int = 0
```

---

### MaterialEstudo (entidade de entrada)

Representa o PDF sendo processado. Não é persistida em JSON — existe apenas em memória
durante o pipeline para carregar metadados entre etapas.

| Campo | Tipo Python | Descrição |
|-------|-------------|-----------|
| `caminho` | `str` | Caminho absoluto do arquivo PDF |
| `nome_arquivo` | `str` | Apenas o nome do arquivo (ex: `"material_df.pdf"`) |
| `hash_sha256` | `str` | SHA-256 do conteúdo (ex: `"sha256:3a7f..."`) |
| `materia` | `str \| None` | Matéria identificada (via spec 003 ou informada pelo usuário) |
| `banca` | `str \| None` | Banca do concurso quando disponível |

---

## Fluxo de Dados (como os dados se movem)

```
[PDF no disco]
       │
       ▼
pdf_converter.py
  ─ MaterialEstudo (metadados: caminho, hash, matéria)
  ─ markdown_texto: str (conteúdo Markdown extraído)
       │
       ▼
content_splitter.py (Padrão Strategy)
  ─ materia_texto: str  ──────────────────────┐
  ─ questoes_brutas: list[str]                │
       │                                       │
       ▼                                       │
topic_repository.py (escrita provisória)       │
  ─ questoes.json (via QuestaoParser)          │
       │                                       │
       │          ◄────────────────────────────┘
       ▼
outline_builder.py (Padrão Builder + Claude)
  ─ Outline (árvore de Topico em memória)
  ─ texto_formatado: str
       │
       ▼
topic_repository.py (escrita final)
  ─ topicos.json (Outline serializado)
  ─ _topicos.txt (texto_formatado)
       │
       ▼
[Pipeline concluído — artefatos em /data/]
```

**Legenda**:
- Setas `──►` = fluxo de dados
- Nomes em *itálico* = objetos Python em memória (não persistidos diretamente)
- Nomes em `monospace` = arquivos no disco

---

## Relacionamentos entre Entidades

- `Topico.id` ←→ `relevancia_topicos.json data[].id` (spec 005 — chave de lookup de relevância)
- `Topico.id` ←→ `anki_export data[].topico_id` (spec 007 — rastreabilidade de flashcards)
- `MaterialEstudo.hash_sha256` ←→ `topicos.json meta.source_hash` (detecção de inconsistência)
- `MaterialEstudo.hash_sha256` ←→ `questoes.json meta.source_hash` (mesma origem garantida)

---

## Diagrama de Dependências entre Arquivos

```
summary_service.py  (Pipeline — orquestrador)
    │
    ├──► pdf_converter.py     (usa: markitdown, pathlib, hashlib)
    │
    ├──► content_splitter.py  (usa: re — estratégias de detecção)
    │         └── EstrategiaEnunciado
    │         └── EstrategiaAlternativas
    │         └── EstrategiaGabarito
    │         └── EstrategiaDefault
    │
    ├──► outline_builder.py   (usa: Claude API via agente, re)
    │         └── OutlineBuilder.adicionar_no()
    │         └── OutlineBuilder.construir() → Outline
    │
    └──► topic_repository.py  (usa: json, pathlib)
              └── TopicRepository.salvar_topicos(Outline) → topicos.json
              └── TopicRepository.salvar_questoes(list[Questao]) → questoes.json
              └── TopicRepository.salvar_outline_txt(str) → _topicos.txt
              └── TopicRepository.carregar_topicos() → Outline
```
