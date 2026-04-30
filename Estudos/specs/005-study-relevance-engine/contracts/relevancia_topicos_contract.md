# Contrato: relevancia_topicos.json

**Feature**: `005-study-relevance-engine` | **Date**: 2026-04-30

> **O que e um contrato de dados?** E um documento que descreve exatamente o formato
> de um arquivo JSON — quais campos existem, quais tipos eles tem e o que cada um
> significa. Com este documento, qualquer sistema que consuma `relevancia_topicos.json`
> (como as specs 006 e 007) pode ser implementado sem ambiguidades.

**Arquivo**: `/data/relevancia_topicos.json`
**Produzido por**: spec 005 (`relevance_repository.py`)
**Consumido por**: spec 006 (publicacao Google Docs), spec 007 (exportacao Anki)
**Versao do schema**: `"1.0"`

---

## Schema Completo

```json
{
  "meta": {
    "materia":         "string  — nome da materia (ex: 'Direito Constitucional')",
    "total_topicos":   "int     — total de topicos no array data[]",
    "estrategia_usada":"string  — 'com_edital' | 'sem_edital'",
    "nivel_rag":       "int     — nivel RAG da classificacao (sempre 1 na v1)",
    "created_at":      "string  — ISO 8601 (ex: '2026-04-30T14:00:00')",
    "version":         "string  — versao do schema (ex: '1.0')"
  },
  "resumo": {
    "alta":              "int          — quantidade de topicos classificados como alta",
    "media":             "int          — quantidade de topicos classificados como media",
    "baixa":             "int          — quantidade de topicos classificados como baixa",
    "fontes_consultadas":"list[string] — ex: ['edital', 'ia']"
  },
  "data": [
    {
      "id":             "string — ID do topico (ex: 't001'); chave de juncao com topicos.json",
      "texto":          "string — texto do topico de nivel L1",
      "classificacao":  "string — 'alta' | 'media' | 'baixa'",
      "emoji":          "string — '🔥' | '⚠️' | '📝'",
      "justificativa":  "string — 1 a 2 frases explicando a decisao em PT-BR",
      "fontes":         "list[string] — subconjunto de ['edital', 'ia']",
      "nivel_confianca":"string — 'alta' | 'media' | 'baixa'"
    }
  ]
}
```

**Invariantes obrigatorias** (o arquivo e invalido se qualquer uma for violada):
- `meta.total_topicos` == `len(data)`
- `resumo.alta + resumo.media + resumo.baixa` == `meta.total_topicos`
- Cada `data[].id` aparece exatamente uma vez (sem duplicatas)
- `data[].classificacao` e um dos tres valores validos (nunca vazio, nunca outro valor)
- `data[].fontes` tem pelo menos um elemento

---

## Exemplo Completo (3 topicos: alta, media, baixa)

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "total_topicos": 3,
    "estrategia_usada": "com_edital",
    "nivel_rag": 1,
    "created_at": "2026-04-30T14:00:00",
    "version": "1.0"
  },
  "resumo": {
    "alta": 1,
    "media": 1,
    "baixa": 1,
    "fontes_consultadas": ["edital", "ia"]
  },
  "data": [
    {
      "id": "t001",
      "texto": "Principios fundamentais da Republica Federativa do Brasil",
      "classificacao": "alta",
      "emoji": "🔥",
      "justificativa": "Consta explicitamente no conteudo programatico do edital como tema obrigatorio. E tema recorrente em provas CESPE com frequencia media de 3 questoes por prova.",
      "fontes": ["edital", "ia"],
      "nivel_confianca": "alta"
    },
    {
      "id": "t002",
      "texto": "Direitos e garantias fundamentais — visao geral",
      "classificacao": "media",
      "emoji": "⚠️",
      "justificativa": "Relacionado ao Titulo II da CF/88 que consta no edital, mas o subtopico especifico nao foi listado explicitamente no conteudo programatico.",
      "fontes": ["edital", "ia"],
      "nivel_confianca": "media"
    },
    {
      "id": "t003",
      "texto": "Historia da Constituicao de 1824",
      "classificacao": "baixa",
      "emoji": "📝",
      "justificativa": "Nao consta no conteudo programatico do edital. Informacao historica tangencial sem relacao com os temas cobrados na prova.",
      "fontes": ["edital"],
      "nivel_confianca": "alta"
    }
  ]
}
```

---

## Guia de Consumo para Specs Downstream

### Como a spec 007 (Anki Export) usa este arquivo

```python
# Trecho ilustrativo — como anki_repository.py lera este arquivo
import json

with open("data/relevancia_topicos.json", encoding="utf-8") as f:
    relevancia = json.load(f)

# Construir indice: id do topico -> classificacao
indice_relevancia = {
    item["id"]: item["classificacao"]
    for item in relevancia["data"]
}

# Uso ao montar flashcard:
classificacao = indice_relevancia.get(topico_id, None)
tag = f"relevancia::{classificacao}" if classificacao else None
```

### Como a spec 006 (Google Docs) usa este arquivo

A spec 006 ordena os topicos por relevancia antes de publicar no documento:
1. Agrupa topicos por `classificacao` (alta → media → baixa)
2. Usa `emoji` como prefixo visual na frente de cada topico
3. Usa `justificativa` em modo debug (se ativado pelo usuario)

### Compatibilidade futura

O campo `meta.version` permite que sistemas downstream verifiquem a versao do schema
antes de ler o arquivo:

```python
if relevancia["meta"]["version"] != "1.0":
    raise ValueError(f"Schema {relevancia['meta']['version']} nao suportado. Esperado: 1.0")
```

Quando uma v2 for necessaria (ex: adicionar campo `tags_edital`), o campo `version`
muda para `"2.0"` e os sistemas downstream podem adaptar seu comportamento com
verificacao explicita — sem quebrar silenciosamente.
