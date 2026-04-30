# Research: Study Google Docs Publishing

**Feature**: `006-study-gdoc-publishing` | **Date**: 2026-04-30

---

## 1. Google Docs API — Como Funciona o `batchUpdate`

> **O que é a Google Docs API?** É um serviço do Google que permite criar, ler e editar
> documentos do Google Docs via código. Você envia requests HTTP com JSON, e o Google
> executa as operações no documento.

### Por que `batchUpdate` e não chamadas individuais?

A Google Docs API tem dois modos de operação:

| Modo | O que faz | Problema |
|------|-----------|---------|
| `documents.create` | Cria um documento vazio | Só cria — não formata |
| `documents.batchUpdate` | Executa múltiplas operações de uma vez | Requer JSON complexo, mas é o único jeito de formatar |

**Decisão: usar `batchUpdate` para tudo após a criação do documento.**

**Por que batch e não chamadas individuais?** Uma chamada HTTP tem overhead de rede
(tempo de ida e volta). Se formatarmos cada linha com uma chamada separada, um documento
de 100 linhas faria 100 chamadas HTTP — lento e sujeito a limites de taxa (rate limiting)
do Google. Com `batchUpdate`, enviamos todas as 100 operações em uma única chamada.
Isso é a mesma razão de usar `addNotes` (batch) em vez de `addNote` no Anki (spec 007).

### Estrutura de um `batchUpdate` request

```python
# Como o gdoc_connector.py chama a API
service.documents().batchUpdate(
    documentId=doc_id,
    body={"requests": [lista_de_requests]}
).execute()
```

Onde `lista_de_requests` é uma lista de dicionários Python. Cada dicionário é uma
operação. Exemplos:

**Inserir texto no final do documento**:
```json
{
  "insertText": {
    "location": {"index": 1},
    "text": "❖ Princípio da Legalidade\n"
  }
}
```

**Aplicar cor vermelha em um intervalo de texto** (🔥 Alta Relevância):
```json
{
  "updateTextStyle": {
    "range": {"startIndex": 1, "endIndex": 28},
    "textStyle": {
      "foregroundColor": {
        "color": {
          "rgbColor": {"red": 0.8, "green": 0.0, "blue": 0.0}
        }
      }
    },
    "fields": "foregroundColor"
  }
}
```

**Aplicar indentação progressiva** (para simular hierarquia L0/L1/L2/L3):
```json
{
  "updateParagraphStyle": {
    "range": {"startIndex": 1, "endIndex": 28},
    "paragraphStyle": {
      "indentFirstLine": {"magnitude": 36.0, "unit": "PT"},
      "indentStart": {"magnitude": 36.0, "unit": "PT"}
    },
    "fields": "indentFirstLine,indentStart"
  }
}
```

> **Índices de caracteres**: A Google Docs API usa índices de caracteres absolutos para
> identificar onde aplicar formatação. O índice 1 é sempre o início do documento
> (índice 0 é reservado). Isso significa que, ao inserir texto, você precisa rastrear
> quantos caracteres foram inseridos para saber o índice correto do próximo elemento.
> O `gdoc_formatter.py` cuida desse rastreamento.

### Mapa de relevância para cores RGB

| Relevância | Ícone | Cor no Google Doc | RGB aproximado |
|------------|-------|-------------------|----------------|
| Alta | 🔥 | Vermelho | `red=0.8, green=0.0, blue=0.0` |
| Média | ⚠️ | Amarelo/Laranja | `red=0.9, green=0.6, blue=0.0` |
| Baixa | 📝 | Cinza | `red=0.5, green=0.5, blue=0.5` |
| Sem classificação | — | Preto (padrão) | sem `updateTextStyle` |

### Mapa de níveis para indentação

| Nível | Significado | Indentação (`PT`) | Marcador |
|-------|-------------|-------------------|---------|
| L0 | Título principal | 0 | Numeração (1, 1.1...) |
| L1 | Subtítulo | 18 PT | ❖ |
| L2 | Detalhe | 36 PT | ➤ |
| L3 | Sub-detalhe | 54 PT | ■ |

---

## 2. OAuth 2.0 Simplificado — O Que É `credentials.json` vs `token.json`

> **Por que explicar OAuth?** Porque é o mecanismo que permite ao seu código usar a conta
> Google do usuário sem armazenar a senha. É um dos conceitos mais importantes em
> integração com APIs modernas.

### Analogia para entender OAuth

Pense em OAuth como um cartão de acesso de hotel:
- Você prova sua identidade na recepção (**primeiro login — abre browser**)
- A recepção entrega um cartão com validade limitada (**token.json**)
- Com o cartão, você abre as portas sem precisar voltar à recepção (**chamadas à API**)
- Quando o cartão expira, ele é renovado automaticamente se você ainda tiver o contrato
  de hospedagem (**refresh token dentro do token.json**)

### `credentials.json` — O "Contrato com o Google"

- **O que é**: Arquivo gerado no Google Cloud Console que identifica a sua **aplicação**
  (não o usuário). Contém `client_id` e `client_secret` — são as credenciais da aplicação.
- **De onde vem**: Você cria no Google Cloud Console → APIs & Services → Credentials →
  Create OAuth client ID → Desktop application → Download JSON. (Ver `quickstart.md`)
- **É secreto?** Sim — não compartilhar publicamente. Mas, ao contrário de senhas, pode
  ser revogado pelo Google Cloud Console sem precisar trocar senha.
- **Muda?** Raramente — só se você revogar e criar novas credenciais.

### `token.json` — O "Cartão de Acesso"

- **O que é**: Arquivo criado automaticamente pelo `google_auth.py` após o primeiro login.
  Contém o `access_token` (validade de ~1 hora) e o `refresh_token` (validade longa).
- **De onde vem**: Criado na primeira execução quando o browser abre para o usuário
  autorizar. O usuário autoriza, o Google retorna tokens, o código salva em `token.json`.
- **É secreto?** Sim — dá acesso à conta Google do usuário. Não deve ser compartilhado.
- **Muda?** O `access_token` dentro do arquivo é renovado automaticamente a cada hora.
  O arquivo em disco é atualizado quando o token é renovado.

### Por que o Primeiro Login Abre o Browser

No primeiro uso (sem `token.json`), o fluxo é:
1. `google_auth.py` detecta que `token.json` não existe
2. Abre o browser com a URL de autorização Google
3. Usuário faz login com sua conta Google e clica em "Autorizar"
4. Google redireciona para `localhost` com um código de autorização
5. `google_auth.py` troca o código pelo token e salva em `token.json`
6. A partir daí, o `token.json` é usado nas próximas execuções

```
Primeira execução:
credentials.json ──► google_auth.py ──► [abre browser] ──► usuário autoriza
                                                         ──► token.json criado
                                                         ──► service retornado

Execuções seguintes:
credentials.json + token.json ──► google_auth.py ──► service retornado (sem browser)
                                                  ──► token.json atualizado se expirou
```

### Código que a Facade Esconde (para referência)

```python
# Isso é o que o google_auth.py faz internamente.
# O resto do código não precisa saber disso — só chama get_service().
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ["https://www.googleapis.com/auth/documents"]

def get_service(api: str = "docs", version: str = "v1"):
    creds = None
    if Path("token.json").exists():
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())      # renova sem abrir browser
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)  # abre browser
        Path("token.json").write_text(creds.to_json())
    return build(api, version, credentials=creds)
```

---

## 3. Estrutura Assumida dos JSONs de Input

> **Por que "assumida"?** A spec 004 define o formato dos arquivos de output; a spec 006
> precisa saber como lê-los. Definimos aqui o formato mais natural baseado nas specs 004
> e 005.

### `topicos.json` (produzido pela spec 004)

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "version": "1.0"
  },
  "data": [
    {
      "id": "t001",
      "level": 0,
      "text": "1. Princípios Fundamentais",
      "children": [
        {
          "id": "t001.1",
          "level": 1,
          "text": "❖ 1.1 Princípio da Legalidade",
          "children": [
            {
              "id": "t001.1.1",
              "level": 2,
              "text": "➤ Art. 5º, II da CF/88"
            }
          ]
        }
      ]
    }
  ]
}
```

### `relevancia_topicos.json` (produzido pela spec 005)

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
      "texto": "1. Princípios Fundamentais",
      "classificacao": "alta",
      "justificativa": "Tema central do edital — cobrado em 80% das provas CESPE.",
      "fontes": ["edital", "ia"],
      "nivel_confianca": "alta"
    }
  ]
}
```

**Mapeamento para formatação visual**:
- `"alta"` → cor vermelha (🔥) no Google Doc; ícone 🔥 antes do texto
- `"media"` → cor amarela (⚠️); ícone ⚠️
- `"baixa"` → cor cinza (📝); ícone 📝
- ID não encontrado em `relevancia_topicos.json` → sem cor, sem ícone

---

## 4. `difflib` para Diff Simplificado — Exemplo Prático

> **O que é `difflib`?** É uma biblioteca da stdlib do Python (sem pip install) que
> compara duas sequências de texto e identifica o que foi adicionado, removido ou alterado.
> É a mesma tecnologia usada pelo `git diff` — simplificada.

### Exemplo de uso no `version_manager.py`

```python
import difflib

versao_antiga = [
    "1. Princípios Fundamentais\n",
    "  1.1 Princípio da Legalidade\n",
    "  1.2 Princípio da Igualdade\n",
]

versao_nova = [
    "1. Princípios Fundamentais\n",
    "  1.1 Princípio da Legalidade (atualizado)\n",
    "  1.2 Princípio da Igualdade\n",
    "  1.3 Princípio da Dignidade Humana\n",  # novo
]

diff = difflib.unified_diff(
    versao_antiga,
    versao_nova,
    fromfile="resumo_2026-04-29.md",
    tofile="resumo_2026-04-30.md",
    lineterm=""
)

print("\n".join(diff))
```

**Saída esperada**:
```
--- resumo_2026-04-29.md
+++ resumo_2026-04-30.md
@@ -1,3 +1,4 @@
 1. Princípios Fundamentais
-  1.1 Princípio da Legalidade
+  1.1 Princípio da Legalidade (atualizado)
 1.2 Princípio da Igualdade
+  1.3 Princípio da Dignidade Humana
```

**Interpretação**:
- Linhas com `-` foram removidas (estavam na versão antiga, não estão na nova)
- Linhas com `+` foram adicionadas (não estavam na versão antiga, estão na nova)
- Linhas sem prefixo são contexto (iguais nas duas versões)

### Versão simplificada para exibir ao usuário

Para exibir no chat (sem o formato técnico de diff unificado), usamos `difflib.ndiff`:

```python
diff = list(difflib.ndiff(versao_antiga, versao_nova))
adicionadas = [l[2:] for l in diff if l.startswith("+ ")]
removidas   = [l[2:] for l in diff if l.startswith("- ")]

print(f"Adicionados: {len(adicionadas)} tópicos")
print(f"Removidos: {len(removidas)} tópicos")
for linha in adicionadas:
    print(f"  + {linha.strip()}")
for linha in removidas:
    print(f"  - {linha.strip()}")
```

---

## 5. Decisões de Design Tomadas

| Decisão | Escolha | Alternativa Descartada | Razão |
|---------|---------|----------------------|-------|
| Formatação via API | `batchUpdate` com requests em batch | Chamadas individuais por linha | Um request HTTP por operação seria lento e atingiria rate limits do Google para docs grandes |
| Markdown antes de GDoc | Salvar local primeiro (Constitution IV) | Salvar após publicação | Se a API falhar, o conteúdo não é perdido; resiliência a falhas de rede |
| Versionamento | Naming Convention (nome do arquivo) | Git interno ou banco de dados | Zero dependências extras; nomes auto-descritivos; ordenação ISO 8601 funciona nativamente |
| Diff | `difflib` (stdlib) | `deepdiff` (terceiro) | Sem dependências extras; diff de texto linha a linha é suficiente para resumos |
| Auth simplificada | Facade `get_service()` | Auth espalhada nos arquivos | Princípio VI (separação de responsabilidades); se o fluxo OAuth mudar, um arquivo muda |
| Índice de caracteres | Rastreamento incremental no formatter | API de `named ranges` | `named ranges` exige um passo extra de leitura do documento; rastreamento incremental é mais simples |
