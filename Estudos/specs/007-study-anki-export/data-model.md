# Data Model: Study Anki Export

**Feature**: `007-study-anki-export` | **Date**: 2026-04-30

> **Por que um data model?** Antes de escrever código, precisamos saber com quais
> "objetos" (dados) o sistema vai trabalhar e como eles se relacionam. Pense nisto
> como o "vocabulário" do sistema.

---

## Entidades

### Flashcard

Unidade central desta feature. Representa um card a ser enviado ao Anki.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `frente` | `str` | Texto da frente do card — L0 do tópico (conceito/pergunta) | ✅ |
| `verso` | `str` | Texto do verso — L1 + L2 concatenados com `\n` | ✅ |
| `deck` | `str` | Nome do deck de destino no Anki | ✅ |
| `tags` | `list[str]` | Lista de tags: `["materia::direito-constitucional", "relevancia::alta"]` | ✅ |
| `topico_id` | `str` | ID do tópico de origem em `topicos.json` (ex: `"t001"`) | ✅ |
| `status` | `str` | `"pendente"` / `"enviado"` / `"duplicata"` / `"erro"` | ✅ |
| `anki_note_id` | `int \| None` | ID retornado pelo AnkiConnect após envio bem-sucedido | Após envio |

**Regras de validação**:
- `frente` com mais de 120 caracteres → truncar para 120 + `"..."` (frente completa vai para início do verso)
- `verso` não pode ser vazio; se L1 e L2 ausentes → usar `"(sem detalhamento)"` como placeholder
- `tags` sempre inclui `materia::<nome-normalizado>` (obrigatório); `relevancia::*` é opcional

**Normalização do nome da matéria para tag**:
- "Direito Constitucional" → `"materia::direito-constitucional"` (lowercase, espaços → hífens, sem acentos)

---

### Deck

Representa um baralho existente no Anki Desktop.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nome` | `str` | Nome completo do deck no Anki (ex: `"Concurso::Direito Constitucional"`) |
| `total_cards` | `int` | Número total de cards no deck |
| `score_match` | `float` | Pontuação de correspondência com a matéria (0.0 a 1.0); calculado internamente |

**Lógica de recomendação** (`deck_service.py`):
1. Para cada deck, calcular `score_match` = fração de palavras da matéria presentes no nome do deck (case-insensitive)
2. Deck com maior `score_match` ≥ 0.5 é recomendado
3. Se nenhum deck atingir 0.5 → sugerir criação de `"Concurso::<Matéria>"`

---

### ArquivoFallback

Gerado quando AnkiConnect está indisponível.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `caminho` | `str` | Path do arquivo, ex: `/data/anki_export_direito-constitucional_20260430.txt` |
| `formato` | `str` | Sempre `"tab-separated"` |
| `materia` | `str` | Nome normalizado da matéria |
| `data_geracao` | `str` | ISO 8601: `"2026-04-30T10:00:00"` |
| `total_cards` | `int` | Número de cards no arquivo |
| `status` | `str` | `"pendente"` (aguardando importação) / `"importado"` (após reenvio) |

---

### ResultadoExportacao

Persistido em `anki_result_<mat>_<dt>.json` ao final do fluxo (Constitution IV).

```json
{
  "meta": {
    "materia": "direito-constitucional",
    "deck": "Concurso::Direito Constitucional",
    "created_at": "2026-04-30T10:30:00",
    "version": "1.0"
  },
  "data": {
    "total": 42,
    "enviados": 38,
    "duplicatas": 3,
    "erros": 1,
    "fallback_gerado": false,
    "cards": [
      {
        "topico_id": "t001",
        "frente": "O que é o princípio da legalidade?",
        "status": "enviado",
        "anki_note_id": 1234567890
      }
    ]
  }
}
```

---

## Fluxo de Dados (como os dados se movem)

```
topicos.json          ──┐
                        ├──► anki_repository.py ──► flashcard_service.py ──► [Flashcard]
relevancia_topicos.json ──┘                                                        │
                                                                                   │
                                                     deck_service.py ──► [Deck]   │
                                                                           │       │
                                                                           ▼       ▼
                                                              anki_connector.py ──► AnkiConnect
                                                                           │
                                                              (se falhar)  ▼
                                                                 anki_export_*.txt (fallback)
                                                                           │
                                                              (sempre)     ▼
                                                                 anki_result_*.json
```

**Legenda**:
- Setas `──►` = fluxo de dados
- `[Flashcard]` = lista de objetos Flashcard em memória (Python)
- `[Deck]` = deck selecionado pelo usuário após recomendação

---

## Relacionamentos entre Entidades

- `Flashcard.topico_id` ←→ `topicos.json data[].id` (chave de busca em relevancia_topicos.json)
- `Flashcard.deck` ←→ `Deck.nome` (deck selecionado no Anki)
- `ResultadoExportacao.data.cards[].topico_id` ←→ `Flashcard.topico_id` (rastreabilidade)
