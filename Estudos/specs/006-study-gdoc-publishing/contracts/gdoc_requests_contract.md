# Contrato: Google Docs API — Batch Requests

**Feature**: `006-study-gdoc-publishing` | **Date**: 2026-04-30

> **O que é um contrato de API?** É um documento que descreve exatamente como chamar
> uma API externa — quais campos enviar, o que esperar de volta, e o que fazer quando
> algo dá errado. Com este documento você pode implementar `gdoc_connector.py` e
> `gdoc_formatter.py` sem precisar descobrir o formato na tentativa e erro.

**Base URL**: `https://docs.googleapis.com/v1/documents`
**Autenticação**: OAuth 2.0 via `google_auth.get_service("docs", "v1")`
**Escopo requerido**: `https://www.googleapis.com/auth/documents`

---

## Operação 1: Criar Documento

**Chamada Python**:
```python
doc = service.documents().create(body={"title": titulo}).execute()
doc_id = doc["documentId"]
doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
```

**Request HTTP gerado internamente**:
```
POST https://docs.googleapis.com/v1/documents
Content-Type: application/json
Authorization: Bearer <token>

{"title": "Resumo — Direito Constitucional (CESPE) 2026-04-30"}
```

**Response (sucesso)**:
```json
{
  "documentId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  "title": "Resumo — Direito Constitucional (CESPE) 2026-04-30",
  "body": {
    "content": [{"endIndex": 1, "startIndex": 0}]
  }
}
```

**Nota**: Documento criado sempre começa com um parágrafo vazio no índice 1.
Todos os `insertText` subsequentes devem começar no índice 1.

---

## Operação 2: `batchUpdate` — Inserir e Formatar Conteúdo

**Chamada Python**:
```python
service.documents().batchUpdate(
    documentId=doc_id,
    body={"requests": lista_de_requests}
).execute()
```

**Importante**: As requests dentro de `batchUpdate` são executadas **em sequência**, na
ordem em que aparecem na lista. Inserções de texto mudam os índices de caracteres —
`gdoc_formatter.py` rastreia o índice atual após cada inserção.

---

## Requests de Inserção de Texto

### Inserir título L0 (sem indentação)

```json
{
  "insertText": {
    "location": {"index": 1},
    "text": "1. Princípios Fundamentais\n"
  }
}
```

Após esta inserção, o índice atual avança 27 caracteres (len("1. Princípios Fundamentais\n")).

### Inserir item L1 (❖, indentação nível 1)

```json
{
  "insertText": {
    "location": {"index": 28},
    "text": "❖ 1.1 Princípio da Legalidade\n"
  }
}
```

---

## Requests de Formatação de Texto

### Aplicar cor vermelha (🔥 Alta Relevância)

```json
{
  "updateTextStyle": {
    "range": {
      "startIndex": 1,
      "endIndex": 28
    },
    "textStyle": {
      "bold": true,
      "foregroundColor": {
        "color": {
          "rgbColor": {
            "red": 0.8,
            "green": 0.0,
            "blue": 0.0
          }
        }
      }
    },
    "fields": "bold,foregroundColor"
  }
}
```

### Aplicar cor amarela/laranja (⚠️ Média Relevância)

```json
{
  "updateTextStyle": {
    "range": {"startIndex": 1, "endIndex": 28},
    "textStyle": {
      "foregroundColor": {
        "color": {
          "rgbColor": {
            "red": 0.9,
            "green": 0.6,
            "blue": 0.0
          }
        }
      }
    },
    "fields": "foregroundColor"
  }
}
```

### Aplicar cor cinza (📝 Baixa Relevância)

```json
{
  "updateTextStyle": {
    "range": {"startIndex": 1, "endIndex": 28},
    "textStyle": {
      "foregroundColor": {
        "color": {
          "rgbColor": {
            "red": 0.5,
            "green": 0.5,
            "blue": 0.5
          }
        }
      }
    },
    "fields": "foregroundColor"
  }
}
```

---

## Requests de Formatação de Parágrafo

### Aplicar indentação por nível

> **PT (pontos tipográficos)**: Unidade de medida para indentação no Google Docs.
> 18 PT é aproximadamente 0.63 cm — suficiente para notar hierarquia visualmente.

| Nível | `indentFirstLine` | `indentStart` |
|-------|------------------|---------------|
| L0 | 0 PT | 0 PT |
| L1 | 18 PT | 18 PT |
| L2 | 36 PT | 36 PT |
| L3 | 54 PT | 54 PT |

```json
{
  "updateParagraphStyle": {
    "range": {
      "startIndex": 28,
      "endIndex": 60
    },
    "paragraphStyle": {
      "indentFirstLine": {
        "magnitude": 18.0,
        "unit": "PT"
      },
      "indentStart": {
        "magnitude": 18.0,
        "unit": "PT"
      }
    },
    "fields": "indentFirstLine,indentStart"
  }
}
```

---

## Exemplo Completo: Publicar 2 Tópicos com Formatação

Cenário: publicar `"1. Princípios Fundamentais"` (🔥 alta relevância, L0) e
`"❖ 1.1 Princípio da Legalidade"` (⚠️ média relevância, L1).

```python
# Gerado pelo gdoc_formatter.py e executado pelo gdoc_connector.py
requests = [
    # --- Tópico 1: L0, Alta Relevância ---
    # 1. Inserir texto no índice 1
    {
        "insertText": {
            "location": {"index": 1},
            "text": "🔥 1. Princípios Fundamentais\n"
        }
    },
    # 2. Aplicar cor vermelha (índice 1 ao 31 = len("🔥 1. Princípios Fundamentais\n"))
    # Nota: emoji 🔥 ocupa 2 índices na contagem da API
    {
        "updateTextStyle": {
            "range": {"startIndex": 1, "endIndex": 31},
            "textStyle": {
                "bold": True,
                "foregroundColor": {"color": {"rgbColor": {"red": 0.8, "green": 0.0, "blue": 0.0}}}
            },
            "fields": "bold,foregroundColor"
        }
    },
    # --- Tópico 2: L1, Média Relevância ---
    # 3. Inserir texto no índice 31 (após tópico 1)
    {
        "insertText": {
            "location": {"index": 31},
            "text": "⚠️ ❖ 1.1 Princípio da Legalidade\n"
        }
    },
    # 4. Aplicar cor amarela
    {
        "updateTextStyle": {
            "range": {"startIndex": 31, "endIndex": 65},
            "textStyle": {
                "foregroundColor": {"color": {"rgbColor": {"red": 0.9, "green": 0.6, "blue": 0.0}}}
            },
            "fields": "foregroundColor"
        }
    },
    # 5. Aplicar indentação L1 (18 PT)
    {
        "updateParagraphStyle": {
            "range": {"startIndex": 31, "endIndex": 65},
            "paragraphStyle": {
                "indentFirstLine": {"magnitude": 18.0, "unit": "PT"},
                "indentStart": {"magnitude": 18.0, "unit": "PT"}
            },
            "fields": "indentFirstLine,indentStart"
        }
    }
]

# Executar tudo de uma vez
service.documents().batchUpdate(
    documentId=doc_id,
    body={"requests": requests}
).execute()
```

---

## Tratamento de Erros da Google Docs API

| Situação | Código HTTP | Comportamento esperado |
|----------|-------------|----------------------|
| `credentials.json` não existe | — | `FileNotFoundError` antes de chamar a API → informar usuário |
| Token inválido / expirado | `401 Unauthorized` | `google_auth.py` renova automaticamente; se falhar, informar para deletar `token.json` e reautenticar |
| Permissão negada (escopo errado) | `403 Forbidden` | Informar ao usuário para verificar escopos em `credentials.json` |
| Rate limit atingido | `429 Too Many Requests` | Aguardar e tentar novamente (exponential backoff); log do erro |
| Documento não encontrado | `404 Not Found` | Nunca deve acontecer neste fluxo (doc criado pela própria feature) |
| Erro genérico de API | `500` | Salvar Markdown local, informar erro, sugerir retry |

### Nota sobre índices de caracteres

Os índices na Google Docs API são contados em **code units Unicode** (UTF-16 code units),
não em caracteres Python. Isso significa:
- Emojis (🔥, ⚠️, 📝) ocupam **2 índices** cada
- Letras, números e pontuação comum ocupam **1 índice** cada
- O `gdoc_formatter.py` deve usar `len(texto.encode("utf-16-le")) // 2` para calcular
  corretamente o avanço de índice após cada inserção
