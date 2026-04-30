# Contrato: Interface Pública do Adapter — `gdoc_connector.py`

**Feature**: `006-study-gdoc-publishing` | **Date**: 2026-04-30

> **Por que documentar a interface?** Porque o `gdoc_service.py` (Template Method) chama
> o `gdoc_connector.py` (Adapter) sem saber como a API funciona internamente. Este
> documento define o "contrato" entre esses dois arquivos — o que o Adapter promete
> entregar e o que espera receber.
>
> **Princípio do Adapter**: O `gdoc_service.py` nunca deve importar `googleapiclient`
> diretamente. Toda chamada à API passa pelo `gdoc_connector.py`.

---

## Interface Pública

Estas são as funções que o `gdoc_service.py` e outros módulos podem chamar.
Funções com prefixo `_` são internas e não devem ser chamadas de fora do arquivo.

### `criar_documento(service, titulo: str) -> str`

Cria um novo documento Google Docs e retorna seu ID.

```python
def criar_documento(service, titulo: str) -> str:
    """
    Cria um novo Google Doc com o título fornecido.

    Args:
        service: Objeto de serviço retornado por google_auth.get_service().
                 Tipo: googleapiclient.discovery.Resource
        titulo:  Título do documento. Ex: "Resumo — Direito Constitucional 2026-04-30"

    Returns:
        doc_id: String com o ID do documento criado.
                Ex: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"

    Raises:
        googleapiclient.errors.HttpError: Se a API retornar erro (ex: 403, 500).
        ValueError: Se titulo for string vazia.

    Uso:
        doc_id = criar_documento(service, "Resumo — Direito Constitucional")
        url = f"https://docs.google.com/document/d/{doc_id}/edit"
    """
```

---

### `aplicar_formatacao(service, doc_id: str, requests: list[dict]) -> None`

Executa um lote de operações de formatação no documento.

```python
def aplicar_formatacao(service, doc_id: str, requests: list[dict]) -> None:
    """
    Executa batchUpdate com a lista de requests fornecida.

    Args:
        service:   Objeto de serviço retornado por google_auth.get_service().
        doc_id:    ID do documento a ser formatado (retornado por criar_documento).
        requests:  Lista de dicts com operações da Google Docs API.
                   Gerada pelo gdoc_formatter.py.
                   Máximo recomendado: 500 requests por chamada.

    Returns:
        None

    Raises:
        googleapiclient.errors.HttpError: Se a API retornar erro.
        ValueError: Se requests for lista vazia ou doc_id for string vazia.

    Nota:
        Requests são executadas em sequência pela API.
        Índices de caracteres são afetados pela ordem de inserção de texto.

    Uso:
        requests = gdoc_formatter.formatar_resumo(topicos, relevancia)
        aplicar_formatacao(service, doc_id, requests)
    """
```

---

### `construir_url(doc_id: str) -> str`

Constrói a URL de edição a partir do ID do documento.

```python
def construir_url(doc_id: str) -> str:
    """
    Constrói a URL de edição do Google Doc.

    Args:
        doc_id: ID do documento. Ex: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"

    Returns:
        URL completa. Ex: "https://docs.google.com/document/d/<doc_id>/edit"

    Uso:
        url = construir_url(doc_id)
        # Registrar em study-memory.json e no frontmatter do Markdown
    """
```

---

## Funções Internas (prefixo `_` — não chamar de fora)

Estas funções existem para organização interna do Adapter. Não fazem parte do contrato.

```python
def _executar_batch(service, doc_id: str, requests: list[dict]) -> dict:
    """
    Wrapper interno ao redor de documents().batchUpdate().execute().
    Separado para facilitar testes e tratamento de erros centralizado.
    """

def _dividir_em_lotes(requests: list[dict], tamanho: int = 500) -> list[list[dict]]:
    """
    Divide lista de requests em sublistas de até 'tamanho' itens.
    Necessário quando o documento tem mais de 500 operações de formatação.
    """
```

---

## Exemplo de Uso Completo (do ponto de vista do `gdoc_service.py`)

```python
# gdoc_service.py usa o Adapter assim:
from google_auth import get_service
from gdoc_connector import criar_documento, aplicar_formatacao, construir_url
from gdoc_formatter import formatar_resumo

def publicar_resumo(topicos: dict, relevancia: dict) -> str:
    """Retorna a URL do Google Doc criado."""
    # Passo 3 do Template Method: autenticar
    service = get_service("docs", "v1")

    # Passo 4a: criar documento vazio
    titulo = f"Resumo — {topicos['meta']['materia']} ({topicos['meta']['banca']})"
    doc_id = criar_documento(service, titulo)

    # Passo 4b: gerar batch requests com formatação
    requests = formatar_resumo(topicos, relevancia)

    # Passo 4c: aplicar formatação via Adapter
    aplicar_formatacao(service, doc_id, requests)

    # Passo 4d: construir e retornar URL
    return construir_url(doc_id)
```

**O que o `gdoc_service.py` não sabe** (e não precisa saber):
- Como funciona HTTP com a Google API
- O formato JSON de `batchUpdate`
- Como tratar `HttpError` da biblioteca
- Como dividir requests em lotes de 500

Tudo isso é responsabilidade do `gdoc_connector.py` (Adapter).

---

## Tratamento de Erros no Adapter

O Adapter captura erros da API e os re-lança como exceções Python padrão, com
mensagens em PT-BR:

```python
from googleapiclient.errors import HttpError

try:
    resultado = service.documents().batchUpdate(...).execute()
except HttpError as e:
    if e.resp.status == 401:
        raise PermissionError(
            "Token inválido ou expirado. Delete token.json e execute novamente."
        ) from e
    elif e.resp.status == 403:
        raise PermissionError(
            "Sem permissão para editar o documento. Verifique os escopos do credentials.json."
        ) from e
    elif e.resp.status == 429:
        raise RuntimeError(
            "Limite de requisições atingido. Aguarde 60 segundos e tente novamente."
        ) from e
    else:
        raise RuntimeError(
            f"Erro na Google Docs API: {e.resp.status} — {e._get_reason()}"
        ) from e
```

**Por que re-lançar como exceções padrão?** Para que o `gdoc_service.py` não precise
importar `googleapiclient.errors.HttpError` — o Adapter absorve a dependência externa
e expõe apenas tipos Python padrão (`PermissionError`, `RuntimeError`, `ValueError`).

---

## Dependências do `gdoc_connector.py`

```python
# Imports necessários (todos externos — instalar via pip)
from googleapiclient.discovery import build          # google-api-python-client
from googleapiclient.errors import HttpError         # google-api-python-client

# Imports stdlib (sem instalação)
from typing import Any
```

**Nota**: `gdoc_connector.py` **não importa** `google_auth`. O objeto `service` é
passado como parâmetro — quem chama é responsável por obter o serviço. Isso mantém
o Adapter testável de forma isolada (pode-se passar um `service` mock nos testes).
