# Research: Study Anki Export

**Feature**: `007-study-anki-export` | **Date**: 2026-04-30

---

## 1. AnkiConnect API — Ações Utilizadas

> **O que é o AnkiConnect?** É um plugin do Anki Desktop que abre um servidor HTTP em
> `localhost:8765`. Você envia um JSON e ele executa a ação no Anki. É como um "controle
> remoto" para o Anki.

Todas as ações seguem o mesmo formato de request:

```json
{
  "action": "<nome-da-acao>",
  "version": 6,
  "params": { "<parametros-especificos>": "..." }
}
```

### Ações mapeadas para esta feature

| Ação | Para que usamos | User Story |
|------|----------------|-----------|
| `deckNames` | Listar todos os decks disponíveis | US1 |
| `getDeckStats` | Obter contagem de cards em cada deck | US1 |
| `createDeck` | Criar novo deck se nenhum corresponder à matéria | US1 |
| `addNotes` | Enviar batch de flashcards de uma só vez (mais eficiente que `addNote` individual) | US2 |
| `findNotes` | Verificar duplicatas antes de enviar (query: `"deck:<nome> Front:<texto>"`) | US2 |

**Alternativas descartadas**:
- `addNote` (singular) — descartado por ser ineficiente para batch; `addNotes` envia array inteiro
- `canAddNotes` — descartado; preferimos tentar `addNotes` com `allowDuplicate: false` e
  tratar `null` no retorno como duplicata (mais simples, menos round-trips)

**Fonte**: Documentação AnkiConnect disponível em `localhost:8765` (quando Anki está aberto)
e código existente em `.github/skills/study-anki/send_to_anki.py`.

---

## 2. Estrutura Assumida de `topicos.json`

> **Por que "assumida"?** A spec 004 define o formato do arquivo `.txt` de outline, mas
> não detalha o JSON interno. Definimos aqui o formato mais natural baseado no que a spec
> descreve, para que as specs 004 e 007 fiquem alinhadas.

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "updated_at": "2026-04-30T10:00:00",
    "source_file": "material_df.pdf",
    "source_hash": "sha256:abc123...",
    "version": "1.0"
  },
  "data": [
    {
      "id": "t001",
      "level": 0,
      "text": "O que é o princípio da legalidade?",
      "children": [
        {
          "id": "t001.1",
          "level": 1,
          "text": "❖ Ninguém é obrigado a fazer ou deixar de fazer algo senão em virtude de lei",
          "children": [
            {
              "id": "t001.1.1",
              "level": 2,
              "text": "➤ Base: Art. 5º, II da CF/88"
            }
          ]
        }
      ]
    }
  ]
}
```

**Regra de mapeamento para flashcard**:
- `frente` = `text` do nó com `level: 0`
- `verso` = `text` dos nós `level: 1` e `level: 2`, concatenados com `\n`
- Se `text` do L0 tiver mais de 120 caracteres → truncar com `"..."` na frente; texto
  completo vai para o início do verso

---

## 3. Estrutura Assumida de `relevancia_topicos.json`

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "created_at": "2026-04-30T11:00:00",
    "version": "1.0"
  },
  "data": [
    {
      "id": "t001",
      "texto": "O que é o princípio da legalidade?",
      "classificacao": "alta",
      "justificativa": "Tema recorrente em provas CESPE — consta no edital explicitamente.",
      "fontes": ["edital", "ia"],
      "nivel_confianca": "alta"
    }
  ]
}
```

**Mapeamento para tag de relevância**:
- `"alta"` → tag `relevancia::alta`
- `"media"` → tag `relevancia::media`
- `"baixa"` → tag `relevancia::baixa`
- Se o ID do tópico não existir em `relevancia_topicos.json` → omitir tag de relevância

---

## 4. Formato do Arquivo de Fallback

> **Por que tab-separated?** O Anki Desktop importa nativo arquivos `.txt` com campos
> separados por tab (tecla Tab). É o formato mais simples sem necessidade de plugin.

```
frente[TAB]verso[TAB]tags
O que é o princípio da legalidade?[TAB]❖ Ninguém é obrigado...\n➤ Base: Art. 5º, II[TAB]materia::direito-constitucional relevancia::alta
```

**Encoding**: UTF-8 com BOM (para compatibilidade com Anki no Windows)
**Tags**: múltiplas tags separadas por espaço na coluna 3
**Sem cabeçalho**: o Anki não espera linha de cabeçalho no formato padrão

---

## 5. Decisões de Design Tomadas

| Decisão | Escolha | Alternativa Descartada | Razão |
|---------|---------|----------------------|-------|
| HTTP client | `urllib` (stdlib) | `requests` (terceiro) | Zero dependências externas — mais simples para aprender e para rodar |
| Batch vs individual | `addNotes` (batch único) | Loop de `addNote` | Um único request HTTP é mais eficiente e atômico |
| Duplicate check | `allowDuplicate: false` + checar `null` no retorno | `canAddNotes` antes de cada envio | Menos round-trips; Anki já trata internamente |
| Fallback encoding | UTF-8 com BOM | UTF-8 sem BOM | BOM garante que o Anki no Windows interprete corretamente caracteres especiais |
| Result persistence | `anki_result_*.json` | Apenas exibir no chat | Constitution IV exige dados estruturados como fonte da verdade |
