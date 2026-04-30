# Contrato: AnkiConnect API

**Feature**: `007-study-anki-export` | **Date**: 2026-04-30

> **O que é um contrato de API?** É um documento que descreve exatamente como chamar
> uma API externa — quais campos enviar, o que esperar de volta, e o que fazer quando
> algo dá errado. Com este documento você pode implementar `anki_connector.py` sem
> precisar descobrir o formato na tentativa e erro.

**Base URL**: `http://127.0.0.1:8765`
**Formato**: Todas as requests são `POST` com `Content-Type: application/json`
**Versão do protocolo**: `6` (campo obrigatório em todas as requests)

---

## Verificação de Conectividade

Antes de qualquer operação, verificar se o AnkiConnect responde.

**Estratégia**: Tentar `deckNames` com timeout de 5s. Se `urllib.error.URLError` → indisponível.

```python
# Pseudocódigo — o que o Adapter deve fazer
try:
    resultado = ankiconnect("deckNames")
    # conectado ✅
except urllib.error.URLError:
    # indisponível → acionar fallback ❌
```

---

## Ação: `deckNames` — Listar Decks

**Request**:
```json
{
  "action": "deckNames",
  "version": 6,
  "params": {}
}
```

**Response (sucesso)**:
```json
{
  "result": ["Default", "Concurso::Direito Constitucional", "Concurso::Português"],
  "error": null
}
```

**Uso**: Obter lista de nomes de decks para recomendação (US1).

---

## Ação: `getDeckStats` — Estatísticas do Deck

**Request**:
```json
{
  "action": "getDeckStats",
  "version": 6,
  "params": {
    "decks": ["Concurso::Direito Constitucional"]
  }
}
```

**Response (sucesso)**:
```json
{
  "result": {
    "123456789": {
      "deck_id": 123456789,
      "name": "Concurso::Direito Constitucional",
      "new_count": 5,
      "learn_count": 2,
      "review_count": 10,
      "total_in_deck": 87
    }
  },
  "error": null
}
```

**Uso**: Exibir `total_in_deck` ao usuário junto com o nome do deck (US1 — Acceptance Scenario 1).

---

## Ação: `createDeck` — Criar Novo Deck

**Request**:
```json
{
  "action": "createDeck",
  "version": 6,
  "params": {
    "deck": "Concurso::Direito Constitucional"
  }
}
```

**Response (sucesso)**: retorna o ID numérico do deck criado.
**Comportamento**: Se o deck já existir, AnkiConnect retorna o ID existente sem erro — operação idempotente.
**Uso**: Criar deck quando o usuário confirmar criação (US1 — Acceptance Scenario 3 e 4).

---

## Ação: `addNotes` — Enviar Batch de Flashcards

**Request**:
```json
{
  "action": "addNotes",
  "version": 6,
  "params": {
    "notes": [
      {
        "deckName": "Concurso::Direito Constitucional",
        "modelName": "Basic",
        "fields": {
          "Front": "O que é o princípio da legalidade?",
          "Back": "❖ Ninguém é obrigado a fazer ou deixar de fazer algo...\n➤ Base: Art. 5º, II da CF/88"
        },
        "options": {
          "allowDuplicate": false,
          "duplicateScope": "deck"
        },
        "tags": ["materia::direito-constitucional", "relevancia::alta"]
      }
    ]
  }
}
```

**Response (sucesso)**:
```json
{
  "result": [1234567890, null, 1234567892],
  "error": null
}
```

**Interpretação do resultado**:
- `int` (ex: `1234567890`) → card criado com sucesso; o número é o `noteId` do Anki
- `null` → card não criado por ser duplicata (mesmo `Front` no mesmo deck)

**Uso**: Enviar todos os flashcards em uma única chamada (US2 — Acceptance Scenario 1 a 4).

---

## Tratamento de Erros do AnkiConnect

| Situação | Comportamento esperado |
|----------|----------------------|
| `urllib.error.URLError` (porta 8765 sem resposta) | Anki fechado ou AnkiConnect não instalado → acionar fallback US3 |
| `response["error"]` não é `null` | Erro do Anki (ex: deck inválido) → registrar no log, exibir mensagem ao usuário |
| Card com `null` no resultado de `addNotes` | Duplicata detectada → registrar como `"duplicata"` no `ResultadoExportacao` |
| Timeout (`timeout=5`) | Tratar como `URLError` → acionar fallback |

---

## Notas de Implementação para `anki_connector.py`

O arquivo deve expor funções de alto nível (não expor detalhes de HTTP):

```python
# Interface pública do Adapter — o que os Services chamam
def verificar_conectividade() -> bool: ...
def listar_decks() -> list[str]: ...
def obter_stats_deck(nome_deck: str) -> dict: ...
def criar_deck(nome_deck: str) -> int: ...
def enviar_notas(notas: list[dict]) -> list[int | None]: ...
```

A função interna `_ankiconnect(action, **params)` que faz o HTTP real deve ser privada
(prefixo `_`). Convenção Python: `_` no início = "uso interno, não chamar diretamente".
