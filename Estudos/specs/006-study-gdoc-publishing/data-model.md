# Data Model: Study Google Docs Publishing

**Feature**: `006-study-gdoc-publishing` | **Date**: 2026-04-30

> **Por que um data model?** Antes de escrever código, precisamos saber com quais
> "objetos" (dados) o sistema vai trabalhar e como eles se relacionam. Pense nisto
> como o "vocabulário" do sistema — os substantivos do seu código.

---

## Entidades

### GoogleDocResumo

Representa um documento Google Docs de resumo publicado por esta feature.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `doc_id` | `str` | ID único do documento no Google Drive (parte da URL) | ✅ |
| `url` | `str` | URL completa do Google Doc (`https://docs.google.com/document/d/<id>/edit`) | ✅ |
| `materia` | `str` | Nome da matéria, ex: `"Direito Constitucional"` | ✅ |
| `banca` | `str` | Nome da banca, ex: `"CESPE"` | ✅ |
| `data_publicacao` | `str` | ISO 8601: `"2026-04-30T10:30:00"` | ✅ |
| `caminho_local` | `str` | Path do Markdown local correspondente, ex: `/Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md` | ✅ |
| `total_topicos` | `int` | Número de tópicos L0 publicados | ✅ |

**Regras de validação**:
- `url` deve ter formato `https://docs.google.com/document/d/<id>/edit`
- `materia` normalizada para nome de arquivo: lowercase, espaços → hífens, sem acentos
- `data_publicacao` em ISO 8601 completo (com hora — para diferenciar múltiplas publicações no dia)

**Persistência**: O campo `gdoc_urls` em `study-memory.json` recebe uma entrada para cada
documento publicado (FR-007). Estrutura do campo:

```json
{
  "gdoc_urls": {
    "resumo": {
      "direito-constitucional": {
        "url": "https://docs.google.com/document/d/ABC123/edit",
        "data_publicacao": "2026-04-30T10:30:00",
        "caminho_local": "/Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md"
      }
    }
  }
}
```

---

### GoogleDocQuestoes

Representa um documento Google Docs de questões. Mesma estrutura do `GoogleDocResumo`
com campo adicional.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `doc_id` | `str` | ID único do documento | ✅ |
| `url` | `str` | URL completa do Google Doc | ✅ |
| `materia` | `str` | Nome da matéria | ✅ |
| `banca` | `str` | Nome da banca | ✅ |
| `data_publicacao` | `str` | ISO 8601 | ✅ |
| `caminho_local` | `str` | Path do Markdown local correspondente | ✅ |
| `total_questoes` | `int` | Total de questões publicadas | ✅ |
| `distribuicao_relevancia` | `dict` | Ex: `{"alta": 10, "media": 20, "baixa": 5}` | ✅ |

**Persistência**: Similar ao `GoogleDocResumo`, mas em `gdoc_urls.questoes`:

```json
{
  "gdoc_urls": {
    "questoes": {
      "direito-constitucional": {
        "url": "https://docs.google.com/document/d/XYZ789/edit",
        "data_publicacao": "2026-04-30T11:00:00",
        "caminho_local": "/Histórico Anotações/Questões/questoes_direito-constitucional_2026-04-30.md"
      }
    }
  }
}
```

---

### VersaoLocal

Representa um arquivo Markdown salvo em `/Histórico Anotações/`. É a "fonte da verdade"
local — existe independente do Google Docs.

| Campo | Tipo | Localização | Descrição | Obrigatório |
|-------|------|-------------|-----------|-------------|
| `materia` | `str` | frontmatter | Nome da matéria | ✅ |
| `banca` | `str` | frontmatter | Nome da banca | ✅ |
| `data` | `str` | frontmatter | Data de criação ISO 8601 | ✅ |
| `tipo` | `str` | frontmatter | `"resumo"` ou `"questoes"` | ✅ |
| `gdoc_url` | `str \| None` | frontmatter | URL do Google Doc (preenchida após publicação bem-sucedida) | Após publicação |
| `conteudo` | `str` | corpo do arquivo | Conteúdo Markdown do resumo ou questões | ✅ |
| `caminho` | `str` | nome do arquivo | Path completo do arquivo, ex: `/Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md` | ✅ |

**Convenção de nome**:
- Resumo: `resumo_<materia-normalizada>_<YYYY-MM-DD>.md`
- Questões: `questoes_<materia-normalizada>_<YYYY-MM-DD>.md`
- Múltiplas versões no mesmo dia: `resumo_<materia>_<YYYY-MM-DD>_<HH-MM>.md`

**Exemplo de arquivo** (`resumo_direito-constitucional_2026-04-30.md`):
```markdown
---
materia: Direito Constitucional
banca: CESPE
data: 2026-04-30T10:28:00
tipo: resumo
gdoc_url: https://docs.google.com/document/d/ABC123/edit
---

# Direito Constitucional — Resumo

## 🔥 1. Princípios Fundamentais

### ❖ 1.1 Princípio da Legalidade
➤ Art. 5º, II da CF/88: ninguém obrigado a fazer ou deixar de fazer algo senão em virtude de lei

## ⚠️ 2. Direitos e Garantias Fundamentais
...
```

**Regra de ordenação**: Listar por nome de arquivo em ordem alfabética reversa
(mais recente primeiro). ISO 8601 garante que `2026-04-30 > 2026-04-29` na ordenação
lexicográfica.

---

## Fluxo de Dados (como os dados se movem)

```
topicos.json           ──┐
_topicos.txt           ──┤
                         ├──► gdoc_service.py (Template Method)
relevancia_topicos.json ──┤        │
questoes.json          ──┤        │ passo 1: gerar conteúdo em memória
relevancia_questoes.json ─┘        │
                                   │
                          ┌────────▼────────┐
                          │  version_manager │  passo 2: salvar Markdown local
                          │  (SEMPRE ANTES)  │  (Constitution IV — sem exceção)
                          └────────┬────────┘
                                   │
                     /Histórico Anotações/Resumo/
                     resumo_<mat>_<YYYY-MM-DD>.md
                                   │
                          ┌────────▼────────┐
                          │  google_auth.py  │  passo 3: autenticar (Facade)
                          │  get_service()   │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │ gdoc_formatter.py│  passo 4: converter outline
                          │ (outline → batch │  para batch requests
                          │  requests)       │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │ gdoc_connector.py│  passo 5: executar batchUpdate
                          │ (Adapter)        │  na Google Docs API
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  study-memory.json│  passo 6: registrar URL
                          │  gdoc_urls        │  (FR-007)
                          └──────────────────┘
```

**Legenda**:
- Setas `──►` = fluxo de dados
- "SEMPRE ANTES" = Constitution IV — o Markdown local é salvo antes de qualquer chamada à API
- Se o passo 5 (API) falhar: o usuário é informado, a versão local (passo 2) já foi salva

---

## Relacionamentos entre Entidades

- `VersaoLocal.caminho` ←→ `GoogleDocResumo.caminho_local` (link entre versão local e doc remoto)
- `VersaoLocal.gdoc_url` = `GoogleDocResumo.url` (atualizado após publicação bem-sucedida)
- `GoogleDocResumo` e `GoogleDocQuestoes` são registrados em `study-memory.json.gdoc_urls`
- `VersaoLocal.materia` usa a mesma normalização de `GoogleDocResumo.materia`
  (lowercase, hífens) para garantir que a busca por versões de uma matéria funcione

---

## Normalização do Nome da Matéria

Usada em nomes de arquivo e chaves de memória:

| Entrada | Normalizado |
|---------|-------------|
| `"Direito Constitucional"` | `"direito-constitucional"` |
| `"Português"` | `"portugues"` |
| `"Matemática Financeira"` | `"matematica-financeira"` |

**Regra**: lowercase → remover acentos (unicodedata.normalize) → espaços para hífens →
remover caracteres especiais.
